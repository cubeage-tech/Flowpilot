package com.flowpilot.flowpilot.scrummaster.service;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.ZoneId;

/**
 * Working-day arithmetic for every sprint calculation in this module.
 *
 * Sprint metrics must not count weekends: a Mon-Fri sprint is five working
 * days, not four (a naive endDate minus startDate) and not seven. Using
 * calendar days understates the required daily burn by roughly 28% on a
 * two-week sprint, which makes a struggling sprint look healthy.
 *
 * One fixed zone is used deliberately. "Today" has to mean the same day for
 * the nightly snapshot job and for a request served from any host, otherwise
 * a sprint gains or loses a day depending on server locale.
 */
public final class ScrumWorkingDays {

    public static final ZoneId ZONE = ZoneId.of("Asia/Kolkata");

    /** Days per calendar week that count as work. Saturday and Sunday do not. */
    private static final int WORKING_DAYS_PER_WEEK = 5;

    /** Monday is 1 and Sunday is 7, so 6 and above is the weekend. */
    private static final int FIRST_WEEKEND_DAY = WORKING_DAYS_PER_WEEK + 1;

    private static final int DAYS_PER_WEEK = 7;

    /**
     * Widest window any sprint measurement will answer for: about ten years of
     * calendar days. Nothing legitimate reaches it, but a mistyped end date
     * ("2099") does, and a five-figure sprint length is no more useful than a
     * clamped one, so the window is capped instead of measured.
     */
    private static final long MAX_WINDOW_DAYS = 3653L;

    /** The same ceiling expressed in working days, for forward arithmetic. */
    private static final int MAX_WORKING_DAYS = 2609;

    private ScrumWorkingDays() {
    }

    public static LocalDate today() {
        return LocalDate.now(ZONE);
    }

    /**
     * Working days from `from` to `to`, inclusive of both ends.
     *
     * Computed in closed form rather than walked a day at a time: whole weeks
     * contribute five days each, and the leftover run of at most six days is
     * counted by arithmetic on the weekday numbers. Every read path in this
     * module calls this several times per request, so the old day-by-day loop
     * turned one far-future end date into hundreds of thousands of iterations
     * per call.
     */
    public static int between(LocalDate from, LocalDate to) {

        if (from == null || to == null || to.isBefore(from)) {
            return 0;
        }

        long span = to.toEpochDay() - from.toEpochDay() + 1;

        if (span > MAX_WINDOW_DAYS) {
            span = MAX_WINDOW_DAYS;
        }

        return workingDaysIn(from.getDayOfWeek(), span);
    }

    /**
     * Working days in a run of `span` consecutive days starting on `firstDay`.
     *
     * The leftover run after the whole weeks is at most six days, so on the
     * Monday=1..Sunday=7 scale it spans the numbers `first`..`first + leftover
     * - 1` and can cross Sunday at most once. Working days are the numbers 1
     * to 5, so each of those two pieces is an intersection of ranges.
     */
    private static int workingDaysIn(DayOfWeek firstDay, long span) {

        long wholeWeeks = span / DAYS_PER_WEEK;
        int leftover = (int) (span % DAYS_PER_WEEK);

        int first = firstDay.getValue();
        int last = first + leftover - 1;

        int withinWeek = Math.max(
                0,
                Math.min(last, WORKING_DAYS_PER_WEEK) - first + 1);

        int afterWrap = last > DAYS_PER_WEEK
                ? Math.min(last - DAYS_PER_WEEK, WORKING_DAYS_PER_WEEK)
                : 0;

        return (int) (wholeWeeks * WORKING_DAYS_PER_WEEK + withinWeek + afterWrap);
    }

    /** Total working days in a sprint window; 0 when the dates are unset. */
    public static int durationOf(LocalDate start, LocalDate end) {
        return between(start, end);
    }

    /**
     * 1-based working-day ordinal of a date within a sprint, or 0 when the
     * date falls outside the window. Day 1 is the sprint's first working day.
     */
    public static int dayNumber(LocalDate start, LocalDate date) {

        if (start == null || date == null || date.isBefore(start)) {
            return 0;
        }

        return between(start, date);
    }

    /**
     * The date `workingDays` working days after `start`, counting `start`
     * itself as day 1: plusWorkingDays(Monday, 1) is that Monday and
     * plusWorkingDays(Monday, 5) is that Friday. The inverse of between(), so
     * between(start, plusWorkingDays(start, n)) is n, which is what makes a
     * sprint planned as 14 working days read back as 14.
     *
     * A weekend `start` rolls forward to the following Monday first, so day 1
     * is always a working day and the answer stays inside the working week.
     * Counts below 1 are treated as 1, and the count is capped the same way
     * between() caps its window. Returns null only for a null `start`.
     */
    public static LocalDate plusWorkingDays(LocalDate start, int workingDays) {

        if (start == null) {
            return null;
        }

        int startDay = start.getDayOfWeek().getValue();

        // Saturday moves on two days, Sunday one
        LocalDate first = startDay >= FIRST_WEEKEND_DAY
                ? start.plusDays(DAYS_PER_WEEK + 1 - startDay)
                : start;

        int steps = Math.min(Math.max(workingDays, 1), MAX_WORKING_DAYS) - 1;

        LocalDate week = first.plusWeeks(steps / WORKING_DAYS_PER_WEEK);
        int leftover = steps % WORKING_DAYS_PER_WEEK;

        // `week` is a working day, so the remaining steps only have to skip
        // the weekend once, and only if they run past Friday
        boolean crossesWeekend =
                week.getDayOfWeek().getValue() + leftover > WORKING_DAYS_PER_WEEK;

        return week.plusDays(leftover + (crossesWeekend ? 2 : 0));
    }

    /** Working days already spent, never negative and never past the end. */
    public static int elapsed(LocalDate start, LocalDate end) {

        if (start == null) {
            return 0;
        }

        LocalDate now = today();

        if (now.isBefore(start)) {
            return 0;
        }

        LocalDate cutoff = (end != null && now.isAfter(end)) ? end : now;

        return between(start, cutoff);
    }

    /** Working days left before the sprint ends, never negative. */
    public static int remaining(LocalDate start, LocalDate end) {

        if (end == null) {
            return 0;
        }

        LocalDate now = today();

        if (now.isAfter(end)) {
            return 0;
        }

        LocalDate from = (start != null && now.isBefore(start)) ? start : now;

        return between(from, end);
    }
}
