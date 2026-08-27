import React, { useEffect, useMemo, useState } from "react";
import {
  Pencil,
  Plus,
  X,
  Power,
  Trash2,
  Search,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

// ============================================================
// API
// ============================================================

const API_BASE_URL = "http://localhost:8080";

const USERS_API = `${API_BASE_URL}/api/superadmin/users`;

// ============================================================
// OPTIONS
// ============================================================

const ROLE_OPTIONS = [
  "Super Admin",
  "Admin",
  "Project Manager",
  "Scrum Master",
  "Developer",
  "QA Engineer",
  "Viewer",
];

const DEPARTMENT_OPTIONS = [
  "Leadership",
  "Operations",
  "Product",
  "Engineering",
  "Quality",
  "Design",
  "Management",
  "Human Resources",
  "Finance",
  "Marketing",
];

const DESIGNATION_OPTIONS = [
  "Chief Executive Officer",
  "Administrator",
  "Project Manager",
  "Scrum Master",
  "Software Developer",
  "QA Engineer",
  "UI/UX Designer",
  "Business Analyst",
  "Team Lead",
  "HR Manager",
  "Finance Manager",
  "Marketing Manager",
  "Viewer",
];

// ============================================================
// TYPES
// ============================================================

interface SuperAdminUser {
  employeeId: number;
  name: string;
  email: string;
  role: string;
  department: string;
  designation: string;
  password?: string;
  status: "Active" | "Inactive";
  lastLogin: string;
  initials: string;
}

interface UserForm {
  name: string;
  email: string;
  role: string;
  department: string;
  designation: string;
  password: string;
}

type ToastType = "success" | "error";

interface Toast {
  id: number;
  type: ToastType;
  message: string;
}

// ============================================================
// EMPTY FORM
// ============================================================

const EMPTY_FORM: UserForm = {
  name: "",
  email: "",
  role: "",
  department: "",
  designation: "",
  password: "",
};

// ============================================================
// AUTH
// ============================================================

const getToken = (): string | null => {
  return (
    localStorage.getItem("token") ||
    localStorage.getItem("jwt") ||
    localStorage.getItem("accessToken")
  );
};

const getAuthHeaders = (): HeadersInit => {
  const token = getToken();

  return {
    "Content-Type": "application/json",

    ...(token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : {}),
  };
};

// ============================================================
// EMPLOYEE ID
// ============================================================

const formatEmployeeId = (employeeId: number): string => {
  return `EMP-${String(employeeId).padStart(3, "0")}`;
};

// ============================================================
// INITIALS
// ============================================================

const getInitials = (name: string): string => {
  if (!name || !name.trim()) {
    return "";
  }

  return name
    .trim()
    .split(/\s+/)
    .map((part) => part.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();
};

// ============================================================
// NORMALIZE USER
// ============================================================

const normalizeUser = (user: any): SuperAdminUser => {
  return {
    employeeId: Number(user.employeeId),

    name: user.name ?? "",

    email: user.email ?? "",

    role: user.role ?? "",

    department: user.department ?? "",

    designation: user.designation ?? "",

    password: undefined,

    status:
      String(user.status).toUpperCase() === "ACTIVE"
        ? "Active"
        : "Inactive",

    lastLogin: user.lastLogin ?? "Never",

    initials:
      user.initials ||
      getInitials(user.name ?? ""),
  };
};

// ============================================================
// LAST LOGIN
// ============================================================

const formatLastLogin = (value: string): string => {
  if (
    !value ||
    value.toLowerCase() === "never"
  ) {
    return "Never";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
};

// ============================================================
// EMAIL VALIDATION
// ============================================================

const validateEmail = (email: string): string => {
  if (!email.trim()) {
    return "Email address is required.";
  }

  const emailRegex =
    /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

  if (!emailRegex.test(email.trim())) {
    return "Please enter a valid email address.";
  }

  return "";
};

// ============================================================
// PASSWORD VALIDATION
// ============================================================

const validatePassword = (
  password: string,
  isEditing: boolean
): string => {
  // During editing, blank password means
  // keep the existing password.
  if (
    isEditing &&
    !password
  ) {
    return "";
  }

  if (!password) {
    return "Password is required.";
  }

  if (password.length < 8) {
    return "Password must be at least 8 characters.";
  }

  if (!/[A-Za-z]/.test(password)) {
    return "Password must contain at least one letter.";
  }

  if (!/[0-9]/.test(password)) {
    return "Password must contain at least one number.";
  }

  if (
    !/[!@#$%^&*(),.?":{}|<>_\-\\[\]/;'`~+=]/.test(
      password
    )
  ) {
    return "Password must contain at least one special character.";
  }

  return "";
};

// ============================================================
// COMPONENT
// ============================================================

const SuperAdminUsers: React.FC = () => {
  // ==========================================================
  // STATE
  // ==========================================================

  const [users, setUsers] =
    useState<SuperAdminUser[]>([]);

  const [form, setForm] =
    useState<UserForm>(EMPTY_FORM);

  const [showForm, setShowForm] =
    useState(false);

  const [
    editingEmployeeId,
    setEditingEmployeeId,
  ] = useState<number | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  // ==========================================================
  // GLOBAL HEADER SEARCH VALUE
  // ==========================================================

  const [globalSearch, setGlobalSearch] =
    useState("");

  // ==========================================================
  // INLINE FIELD ERRORS
  // ==========================================================

  const [emailError, setEmailError] =
    useState("");

  const [passwordError, setPasswordError] =
    useState("");

  // ==========================================================
  // FLOATING TOAST
  // ==========================================================

  const [toast, setToast] =
    useState<Toast | null>(null);

  // ==========================================================
  // SHOW TOAST
  // ==========================================================

  const showToast = (
    type: ToastType,
    message: string
  ) => {
    const id = Date.now();

    setToast({
      id,
      type,
      message,
    });

    window.setTimeout(() => {
      setToast((current) =>
        current?.id === id
          ? null
          : current
      );
    }, 3000);
  };

  // ==========================================================
  // LOAD USERS
  // ==========================================================

  const loadUsers = async () => {
    try {
      setLoading(true);

      const response = await fetch(
        USERS_API,
        {
          method: "GET",
          headers: getAuthHeaders(),
        }
      );

      const responseText =
        await response.text();

      let data: any = null;

      try {
        data = responseText
          ? JSON.parse(responseText)
          : null;
      } catch {
        data = null;
      }

      if (!response.ok) {
        throw new Error(
          data?.message ||
            data?.error ||
            responseText ||
            `Failed to load users (${response.status}).`
        );
      }

      const normalizedUsers:
        SuperAdminUser[] =
        Array.isArray(data)
          ? data.map(normalizeUser)
          : [];

      setUsers(normalizedUsers);
    } catch (err) {
      console.error(
        "Load users error:",
        err
      );

      showToast(
        "error",
        err instanceof Error
          ? err.message
          : "Unable to load users."
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================
  // INITIAL LOAD
  // ==========================================================

  useEffect(() => {
    loadUsers();
  }, []);

  // ==========================================================
  // GLOBAL HEADER SEARCH
  // ==========================================================
  // DashboardLayout is a common/mentor-controlled file and is
  // intentionally NOT modified. The existing header search input
  // is detected directly from this page.
  //
  // Only the input whose placeholder is exactly "Search..." is
  // treated as the global header search. Form inputs are ignored.

  useEffect(() => {
    const getHeaderSearchInput = (): HTMLInputElement | null => {
      const inputs = Array.from(
        document.querySelectorAll<HTMLInputElement>(
          'input[placeholder="Search..."]'
        )
      );

      return inputs.length > 0 ? inputs[0] : null;
    };

    const handleGlobalSearchInput = (event: Event) => {
      const target = event.target as HTMLInputElement | null;

      if (!target) {
        return;
      }

      if (
        target.tagName === "INPUT" &&
        target.getAttribute("placeholder") === "Search..."
      ) {
        setGlobalSearch(target.value);
      }
    };

    const headerSearchInput = getHeaderSearchInput();

    if (headerSearchInput) {
      setGlobalSearch(headerSearchInput.value);
    }

    document.addEventListener(
      "input",
      handleGlobalSearchInput,
      true
    );

    return () => {
      document.removeEventListener(
        "input",
        handleGlobalSearchInput,
        true
      );
    };
  }, []);

  // ==========================================================
  // COUNTS
  // ==========================================================

  const totalUsers =
    users.length;

  const activeUsers =
    users.filter(
      (user) =>
        user.status === "Active"
    ).length;

  // ==========================================================
  // FILTER USERS FROM THE MAIN HEADER SEARCH
  // ==========================================================

  const filteredUsers = useMemo(() => {
    const search = globalSearch.trim().toLowerCase();

    if (!search) {
      return users;
    }

    return users.filter((user) => {
      const employeeId = formatEmployeeId(user.employeeId).toLowerCase();
      const numericEmployeeId = String(user.employeeId).toLowerCase();

      return (
        employeeId.includes(search) ||
        numericEmployeeId.includes(search) ||
        user.name.toLowerCase().includes(search) ||
        user.email.toLowerCase().includes(search) ||
        user.role.toLowerCase().includes(search) ||
        user.department.toLowerCase().includes(search) ||
        user.designation.toLowerCase().includes(search)
      );
    });
  }, [users, globalSearch]);

  // ==========================================================
  // INPUT CHANGE
  // ==========================================================

  const handleInputChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const {
      name,
      value,
    } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    // --------------------------------------------------------
    // EMAIL LIVE VALIDATION
    // --------------------------------------------------------

    if (name === "email") {
      if (!value.trim()) {
        setEmailError("");
      } else {
        setEmailError(
          validateEmail(value)
        );
      }
    }

    // --------------------------------------------------------
    // PASSWORD LIVE VALIDATION
    // --------------------------------------------------------

    if (name === "password") {
      setPasswordError(
        validatePassword(
          value,
          editingEmployeeId !== null
        )
      );
    }
  };

  // ==========================================================
  // SELECT CHANGE
  // ==========================================================

  const handleSelectChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const {
      name,
      value,
    } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // ==========================================================
  // ADD USER
  // ==========================================================

  const handleAddUser = () => {
    setForm(EMPTY_FORM);

    setEditingEmployeeId(null);

    setEmailError("");

    setPasswordError("");

    setShowForm(true);
  };

  // ==========================================================
  // CANCEL
  // ==========================================================

  const handleCancel = () => {
    if (saving) {
      return;
    }

    setForm(EMPTY_FORM);

    setEditingEmployeeId(null);

    setShowForm(false);

    setEmailError("");

    setPasswordError("");
  };

  // ==========================================================
  // CREATE USER
  // ==========================================================

  const createUser = async () => {
    try {
      setSaving(true);

      const response = await fetch(
        USERS_API,
        {
          method: "POST",

          headers:
            getAuthHeaders(),

          body: JSON.stringify({
            name:
              form.name.trim(),

            email:
              form.email.trim(),

            role:
              form.role,

            department:
              form.department,

            designation:
              form.designation,

            password:
              form.password,
          }),
        }
      );

      const responseText =
        await response.text();

      let data: any = null;

      try {
        data = responseText
          ? JSON.parse(responseText)
          : null;
      } catch {
        data = null;
      }

      if (!response.ok) {
        throw new Error(
          data?.message ||
            data?.error ||
            responseText ||
            `Failed to create user (${response.status}).`
        );
      }

      const newUser =
        normalizeUser(data);

      setUsers(
        (previous) => [
          ...previous,
          newUser,
        ]
      );

      setForm(EMPTY_FORM);

      setShowForm(false);

      setEmailError("");

      setPasswordError("");

      showToast(
        "success",
        `${formatEmployeeId(
          newUser.employeeId
        )} created successfully.`
      );
    } catch (err) {
      console.error(
        "Create user error:",
        err
      );

      showToast(
        "error",
        err instanceof Error
          ? err.message
          : "Unable to create user."
      );
    } finally {
      setSaving(false);
    }
  };

  // ==========================================================
  // UPDATE USER
  // ==========================================================

  const updateUser = async () => {
    if (
      editingEmployeeId === null
    ) {
      return;
    }

    try {
      setSaving(true);

      const response =
        await fetch(
          `${USERS_API}/${editingEmployeeId}`,
          {
            method: "PUT",

            headers:
              getAuthHeaders(),

            body: JSON.stringify({
              name:
                form.name.trim(),

              email:
                form.email.trim(),

              role:
                form.role,

              department:
                form.department,

              designation:
                form.designation,

              password:
                form.password.trim()
                  ? form.password.trim()
                  : null,
            }),
          }
        );

      const responseText =
        await response.text();

      let data: any = null;

      try {
        data = responseText
          ? JSON.parse(responseText)
          : null;
      } catch {
        data = null;
      }

      if (!response.ok) {
        throw new Error(
          data?.message ||
            data?.error ||
            responseText ||
            `Failed to update user (${response.status}).`
        );
      }

      const updatedUser =
        normalizeUser(data);

      setUsers(
        (previous) =>
          previous.map(
            (user) =>
              user.employeeId ===
              editingEmployeeId
                ? updatedUser
                : user
          )
      );

      setForm(EMPTY_FORM);

      setEditingEmployeeId(null);

      setShowForm(false);

      setEmailError("");

      setPasswordError("");

      showToast(
        "success",
        `${formatEmployeeId(
          updatedUser.employeeId
        )} updated successfully.`
      );
    } catch (err) {
      console.error(
        "Update user error:",
        err
      );

      showToast(
        "error",
        err instanceof Error
          ? err.message
          : "Unable to update user."
      );
    } finally {
      setSaving(false);
    }
  };

  // ==========================================================
  // FORM SUBMIT
  // ==========================================================

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    // --------------------------------------------------------
    // NAME
    // --------------------------------------------------------

    if (!form.name.trim()) {
      showToast(
        "error",
        "Full name is required."
      );

      return;
    }

    // --------------------------------------------------------
    // EMAIL
    // --------------------------------------------------------

    const emailValidation =
      validateEmail(form.email);

    setEmailError(
      emailValidation
    );

    if (emailValidation) {
      return;
    }

    // --------------------------------------------------------
    // ROLE
    // --------------------------------------------------------

    if (!form.role) {
      showToast(
        "error",
        "Please select a role."
      );

      return;
    }

    // --------------------------------------------------------
    // DEPARTMENT
    // --------------------------------------------------------

    if (!form.department) {
      showToast(
        "error",
        "Please select a department."
      );

      return;
    }

    // --------------------------------------------------------
    // DESIGNATION
    // --------------------------------------------------------

    if (!form.designation) {
      showToast(
        "error",
        "Please select a designation."
      );

      return;
    }

    // --------------------------------------------------------
    // PASSWORD
    // --------------------------------------------------------

    const passwordValidation =
      validatePassword(
        form.password,
        editingEmployeeId !== null
      );

    setPasswordError(
      passwordValidation
    );

    if (passwordValidation) {
      return;
    }

    // --------------------------------------------------------
    // SAVE
    // --------------------------------------------------------

    if (
      editingEmployeeId !== null
    ) {
      await updateUser();
    } else {
      await createUser();
    }
  };

  // ==========================================================
  // EDIT USER
  // ==========================================================

  const handleEdit = async (
    employeeId: number
  ) => {
    try {
      const response =
        await fetch(
          `${USERS_API}/${employeeId}`,
          {
            method: "GET",
            headers:
              getAuthHeaders(),
          }
        );

      const responseText =
        await response.text();

      let data: any = null;

      try {
        data = responseText
          ? JSON.parse(responseText)
          : null;
      } catch {
        data = null;
      }

      if (!response.ok) {
        throw new Error(
          data?.message ||
            data?.error ||
            responseText ||
            "Unable to load user details."
        );
      }

      setForm({
        name:
          data.name || "",

        email:
          data.email || "",

        role:
          data.role || "",

        department:
          data.department || "",

        designation:
          data.designation || "",

        password: "",
      });

      setEditingEmployeeId(
        Number(
          data.employeeId
        )
      );

      setEmailError("");

      setPasswordError("");

      setShowForm(true);
    } catch (err) {
      console.error(
        "Edit user error:",
        err
      );

      showToast(
        "error",
        err instanceof Error
          ? err.message
          : "Unable to load user."
      );
    }
  };

  // ==========================================================
  // ENABLE / DISABLE USER
  // ==========================================================

  const handleStatusToggle = async (
    user: SuperAdminUser
  ) => {
    try {
      const response =
        await fetch(
          `${USERS_API}/${user.employeeId}/status`,
          {
            method: "PATCH",
            headers:
              getAuthHeaders(),
          }
        );

      const responseText =
        await response.text();

      let data: any = null;

      try {
        data = responseText
          ? JSON.parse(responseText)
          : null;
      } catch {
        data = null;
      }

      if (!response.ok) {
        throw new Error(
          data?.message ||
            data?.error ||
            responseText ||
            `Unable to change user status (${response.status}).`
        );
      }

      const updatedUser =
        normalizeUser(data);

      setUsers(
        (previous) =>
          previous.map(
            (userItem) =>
              userItem.employeeId ===
              user.employeeId
                ? updatedUser
                : userItem
          )
      );

      showToast(
        "success",
        `${formatEmployeeId(
          user.employeeId
        )} ${
          updatedUser.status === "Active"
            ? "enabled"
            : "disabled"
        } successfully.`
      );
    } catch (err) {
      console.error(
        "Change user status error:",
        err
      );

      showToast(
        "error",
        err instanceof Error
          ? err.message
          : "Unable to change user status."
      );
    }
  };

  // ==========================================================
  // DELETE USER
  // ==========================================================

  const handleDelete = async (
    user: SuperAdminUser
  ) => {
    const confirmed =
      window.confirm(
        `Are you sure you want to permanently delete ${user.name}?`
      );

    if (!confirmed) {
      return;
    }

    try {
      const response =
        await fetch(
          `${USERS_API}/${user.employeeId}`,
          {
            method: "DELETE",
            headers:
              getAuthHeaders(),
          }
        );

      const responseText =
        await response.text();

      if (!response.ok) {
        let message =
          "Unable to delete user.";

        try {
          const data =
            responseText
              ? JSON.parse(
                  responseText
                )
              : null;

          message =
            data?.message ||
            data?.error ||
            responseText ||
            message;
        } catch {
          if (responseText) {
            message =
              responseText;
          }
        }

        throw new Error(
          message
        );
      }

      setUsers(
        (previous) =>
          previous.filter(
            (item) =>
              item.employeeId !==
              user.employeeId
          )
      );

      showToast(
        "success",
        `${formatEmployeeId(
          user.employeeId
        )} deleted successfully.`
      );
    } catch (err) {
      console.error(
        "Delete user error:",
        err
      );

      showToast(
        "error",
        err instanceof Error
          ? err.message
          : "Unable to delete user."
      );
    }
  };

  // ==========================================================
  // JSX
  // ==========================================================

  return (
    <div className="w-full">

      {/* ======================================================
          FLOATING TOAST
      ====================================================== */}

      {toast && (
        <div
          className="
            fixed
            right-6
            top-6
            z-[9999]
            w-[360px]
            max-w-[calc(100vw-32px)]
            animate-[toastIn_0.25s_ease-out]
          "
        >
          <div
            className={`
              flex
              items-start
              gap-3
              rounded-[12px]
              border
              bg-white
              px-4
              py-3.5
              shadow-[0_12px_35px_rgba(15,23,42,0.16)]
              ${
                toast.type ===
                "success"
                  ? "border-[#c7efd9]"
                  : "border-[#ffd0d0]"
              }
            `}
          >

            {/* ICON */}

            <div
              className={`
                mt-0.5
                flex
                h-8
                w-8
                shrink-0
                items-center
                justify-center
                rounded-full
                ${
                  toast.type ===
                  "success"
                    ? "bg-[#e9fbf1] text-[#00a86b]"
                    : "bg-[#fff0f0] text-[#ef4444]"
                }
              `}
            >
              {toast.type ===
              "success" ? (
                <CheckCircle2
                  size={17}
                />
              ) : (
                <AlertCircle
                  size={17}
                />
              )}
            </div>

            {/* MESSAGE */}

            <div className="min-w-0 flex-1">

              <p
                className={`
                  text-[12px]
                  font-extrabold
                  ${
                    toast.type ===
                    "success"
                      ? "text-[#087443]"
                      : "text-[#d22f2f]"
                  }
                `}
              >
                {toast.type ===
                "success"
                  ? "Success"
                  : "Error"}
              </p>

              <p
                className="
                  mt-0.5
                  break-words
                  text-[12px]
                  font-medium
                  leading-5
                  text-[#526b87]
                "
              >
                {toast.message}
              </p>

            </div>

            {/* CLOSE */}

            <button
              type="button"
              onClick={() =>
                setToast(null)
              }
              className="
                shrink-0
                rounded-md
                p-1
                text-[#9aa8b8]
                transition
                hover:bg-[#f3f5f8]
                hover:text-[#526b87]
              "
            >
              <X size={15} />
            </button>

          </div>
        </div>
      )}

      {/* ======================================================
          MAIN
      ====================================================== */}

      <main
        className="
          px-4
          pb-10
          pt-7
          sm:px-6
          lg:px-8
        "
      >

        {/* ====================================================
            TOP BAR
        ==================================================== */}

        <div
          className="
            mb-5
            flex
            flex-col
            gap-4
            xl:flex-row
            xl:items-center
            xl:justify-between
          "
        >

          {/* SUMMARY */}

          <div
            className="
              text-[15px]
              font-medium
              text-[#7185a0]
            "
          >
            {totalUsers}
            {" "}
            total members

            <span className="mx-2">
              ·
            </span>

            {activeUsers}
            {" "}
            active

          </div>

          {/* ADD USER */}

          <button
            type="button"
            onClick={handleAddUser}
            className="
              inline-flex
              h-11
              shrink-0
              items-center
              justify-center
              gap-2
              rounded-[10px]
              bg-[#ff3040]
              px-5
              text-[14px]
              font-bold
              text-white
              shadow-[0_5px_14px_rgba(255,48,64,0.20)]
              transition
              hover:bg-[#ef2838]
              active:scale-[0.98]
            "
          >
            <Plus
              size={17}
              strokeWidth={2.8}
            />
            Add User
          </button>

        </div>

        {/* ====================================================
            ADD / EDIT FORM
        ==================================================== */}

        {showForm && (
          <div
            className="
              mb-5
              rounded-[16px]
              border
              border-[#e3e7ed]
              bg-white
              p-6
              shadow-[0_5px_18px_rgba(31,45,61,0.08)]
            "
          >

            {/* FORM HEADER */}

            <div
              className="
                mb-5
                flex
                items-center
                justify-between
              "
            >

              <h2
                className="
                  text-[16px]
                  font-extrabold
                  text-[#111827]
                "
              >
                {editingEmployeeId !==
                null
                  ? "Edit User"
                  : "Add New User"}
              </h2>

              <button
                type="button"
                onClick={
                  handleCancel
                }
                disabled={saving}
                className="
                  flex
                  h-8
                  w-8
                  items-center
                  justify-center
                  rounded-lg
                  text-[#718096]
                  transition
                  hover:bg-[#f3f5f8]
                "
              >
                <X size={17} />
              </button>

            </div>

            <form
              onSubmit={
                handleSubmit
              }
            >

              {/* FORM FIELDS */}

              <div
                className="
                  grid
                  grid-cols-1
                  gap-4
                  md:grid-cols-2
                  xl:grid-cols-3
                "
              >

                <FormInput
                  label="FULL NAME"
                  name="name"
                  value={
                    form.name
                  }
                  onChange={
                    handleInputChange
                  }
                  placeholder="Full Name"
                />

                <FormInput
                  label="EMAIL ADDRESS"
                  name="email"
                  type="email"
                  value={
                    form.email
                  }
                  onChange={
                    handleInputChange
                  }
                  placeholder="Email Address"
                  error={
                    emailError
                  }
                />

                <FormSelect
                  label="ROLE"
                  name="role"
                  value={
                    form.role
                  }
                  onChange={
                    handleSelectChange
                  }
                  placeholder="Select Role"
                  options={
                    ROLE_OPTIONS
                  }
                />

                <FormSelect
                  label="DEPARTMENT"
                  name="department"
                  value={
                    form.department
                  }
                  onChange={
                    handleSelectChange
                  }
                  placeholder="Select Department"
                  options={
                    DEPARTMENT_OPTIONS
                  }
                />

                <FormSelect
                  label="DESIGNATION"
                  name="designation"
                  value={
                    form.designation
                  }
                  onChange={
                    handleSelectChange
                  }
                  placeholder="Select Designation"
                  options={
                    DESIGNATION_OPTIONS
                  }
                />

                <FormInput
                  label="PASSWORD"
                  name="password"
                  type="password"
                  value={
                    form.password
                  }
                  onChange={
                    handleInputChange
                  }
                  placeholder={
                    editingEmployeeId !==
                    null
                      ? "Leave blank to keep current"
                      : "Password"
                  }
                  error={
                    passwordError
                  }
                />

              </div>

              {/* FORM BUTTONS */}

              <div
                className="
                  mt-5
                  flex
                  items-center
                  gap-3
                "
              >

                <button
                  type="submit"
                  disabled={saving}
                  className="
                    inline-flex
                    h-11
                    items-center
                    justify-center
                    rounded-[9px]
                    bg-[#ff3040]
                    px-6
                    text-[14px]
                    font-bold
                    text-white
                    shadow-[0_4px_10px_rgba(255,48,64,0.18)]
                    transition
                    hover:bg-[#ef2838]
                    disabled:cursor-not-allowed
                    disabled:opacity-60
                  "
                >
                  {saving
                    ? "Saving..."
                    : editingEmployeeId !==
                      null
                    ? "Update User"
                    : "Create User"}
                </button>

                <button
                  type="button"
                  onClick={
                    handleCancel
                  }
                  disabled={saving}
                  className="
                    h-11
                    rounded-[9px]
                    border
                    border-[#d7dce3]
                    bg-[#f7f8fa]
                    px-6
                    text-[14px]
                    font-semibold
                    text-[#44546a]
                    transition
                    hover:bg-[#eef0f3]
                  "
                >
                  Cancel
                </button>

              </div>

            </form>

          </div>
        )}

        {/* ====================================================
            USERS TABLE
        ==================================================== */}

        <div
          className="
            w-full
            overflow-hidden
            rounded-[16px]
            border
            border-[#e2e7ed]
            bg-white
          "
        >

          {/* LOADING */}

          {loading ? (
            <div
              className="
                flex
                h-[400px]
                items-center
                justify-center
                text-[14px]
                text-[#7185a0]
              "
            >
              Loading users...
            </div>

          ) : users.length === 0 ? (

            <div
              className="
                flex
                h-[400px]
                items-center
                justify-center
                text-[14px]
                text-[#7185a0]
              "
            >
              No users found.
            </div>

          ) : filteredUsers.length === 0 ? (

            <div
              className="
                flex
                h-[300px]
                flex-col
                items-center
                justify-center
                gap-3
                text-center
              "
            >

              <div
                className="
                  flex
                  h-12
                  w-12
                  items-center
                  justify-center
                  rounded-full
                  bg-[#f3f5f8]
                  text-[#91a0b2]
                "
              >
                <Search
                  size={22}
                />
              </div>

              <p
                className="
                  text-[14px]
                  font-semibold
                  text-[#526b87]
                "
              >
                No users match your search.
              </p>

              <button
                type="button"
                onClick={() =>
                  setGlobalSearch("")
                }
                className="
                  text-[12px]
                  font-semibold
                  text-[#ff3040]
                  hover:underline
                "
              >
                Clear search
              </button>

            </div>

          ) : (

            <>

            {/* DESKTOP TABLE */}

            <div
              className="
                hidden
                w-full
                overflow-x-auto
                md:block
              "
            >

              <table
                className="
                  w-full
                  min-w-[1100px]
                  border-collapse
                "
              >

                <colgroup>
                  <col className="w-[10%]" />
                  <col className="w-[15%]" />
                  <col className="w-[17%]" />
                  <col className="w-[13%]" />
                  <col className="w-[12%]" />
                  <col className="w-[9%]" />
                  <col className="w-[10%]" />
                  <col className="w-[14%]" />
                </colgroup>

                {/* HEADER */}

                <thead>
                  <tr
                    className="
                      border-b
                      border-[#edf0f4]
                    "
                  >

                    <TableHeader>
                      EMPLOYEE ID
                    </TableHeader>

                    <TableHeader>
                      NAME
                    </TableHeader>

                    <TableHeader>
                      EMAIL
                    </TableHeader>

                    <TableHeader>
                      ROLE
                    </TableHeader>

                    <TableHeader>
                      DEPARTMENT
                    </TableHeader>

                    <TableHeader>
                      STATUS
                    </TableHeader>

                    <TableHeader>
                      LAST LOGIN
                    </TableHeader>

                    <TableHeader>
                      ACTIONS
                    </TableHeader>

                  </tr>
                </thead>

                {/* BODY */}

                <tbody>

                  {filteredUsers.map(
                    (user) => (
                      <tr
                        key={
                          user.employeeId
                        }
                        className="
                          border-b
                          border-[#edf1f5]
                          last:border-b-0
                          transition
                          hover:bg-[#fcfdfe]
                        "
                      >

                        {/* EMPLOYEE ID */}

                        <TableCell>
                          <span
                            className="
                              text-[13px]
                              font-medium
                              text-[#66809f]
                            "
                          >
                            {formatEmployeeId(
                              user.employeeId
                            )}
                          </span>
                        </TableCell>

                        {/* NAME */}

                        <TableCell>
                          <div
                            className="
                              flex
                              items-center
                            "
                          >

                            <span
                              className="
                                truncate
                                text-[14px]
                               font-semibold
                               text-[#111827]
                              "
                            >
                              {user.name}
                            </span>

                          </div>
                        </TableCell>

                        {/* EMAIL */}

                        <TableCell>
                          <span
                            className="
                              block
                              truncate
                              text-[13px]
                              text-[#294766]
                            "
                          >
                            {user.email}
                          </span>
                        </TableCell>

                        {/* ROLE */}

                        <TableCell>
                          <span
                            className="
                              inline-flex
                              max-w-full
                              truncate
                              rounded-[7px]
                              bg-[#f0f2f5]
                              px-2.5
                              py-1
                              text-[11px]
                              font-bold
                              text-[#405a77]
                            "
                          >
                            {user.role}
                          </span>
                        </TableCell>

                        {/* DEPARTMENT */}

                        <TableCell>
                          <span
                            className="
                              text-[13px]
                              text-[#294766]
                            "
                          >
                            {user.department}
                          </span>
                        </TableCell>

                        {/* STATUS */}

                        <TableCell>
                          {user.status ===
                          "Active" ? (

                            <span
                              className="
                                inline-flex
                                rounded-[7px]
                                bg-[#dff7ea]
                                px-2.5
                                py-1
                                text-[11px]
                                font-extrabold
                                text-[#00864b]
                              "
                            >
                              Active
                            </span>

                          ) : (

                            <span
                              className="
                                inline-flex
                                rounded-[7px]
                                bg-[#edf0f3]
                                px-2.5
                                py-1
                                text-[11px]
                                font-extrabold
                                text-[#718096]
                              "
                            >
                              Inactive
                            </span>

                          )}
                        </TableCell>

                        {/* LAST LOGIN */}

                        <TableCell>
                          <span
                            className="
                              whitespace-nowrap
                              text-[12px]
                              text-[#91a0b2]
                            "
                          >
                            {formatLastLogin(
                              user.lastLogin
                            )}
                          </span>
                        </TableCell>

                        {/* ACTIONS */}

                        <TableCell>
                          <div
                            className="
                              flex
                              items-center
                              gap-2
                            "
                          >

                            {/* EDIT */}

                            <button
                              type="button"
                              onClick={() =>
                                handleEdit(
                                  user.employeeId
                                )
                              }
                              className="
                                inline-flex
                                h-8
                                items-center
                                gap-1
                                rounded-[7px]
                                border
                                border-[#b5ead4]
                                bg-[#f4fff9]
                                px-2.5
                                text-[11px]
                                font-bold
                                text-[#00a86b]
                                transition
                                hover:bg-[#e9fff4]
                                active:scale-95
                              "
                            >
                              <Pencil
                                size={12}
                              />
                              Edit
                            </button>

                            {/* ENABLE / DISABLE */}

                            <button
                              type="button"
                              onClick={() =>
                                handleStatusToggle(
                                  user
                                )
                              }
                              className={`
                                inline-flex
                                h-8
                                items-center
                                gap-1
                                rounded-[7px]
                                border
                                px-2.5
                                text-[11px]
                                font-bold
                                transition
                                active:scale-95
                                ${
                                  user.status ===
                                  "Active"
                                    ? `
                                      border-[#ffdba8]
                                      bg-[#fffaf1]
                                      text-[#d97900]
                                      hover:bg-[#fff5df]
                                    `
                                    : `
                                      border-[#b5ead4]
                                      bg-[#f4fff9]
                                      text-[#00a86b]
                                      hover:bg-[#e9fff4]
                                    `
                                }
                              `}
                            >
                              <Power
                                size={12}
                              />
                              {user.status ===
                              "Active"
                                ? "Disable"
                                : "Enable"}
                            </button>

                            {/* DELETE - ONLY FOR INACTIVE USERS */}

                            {user.status ===
                              "Inactive" && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleDelete(
                                    user
                                  )
                                }
                                className="
                                  inline-flex
                                  h-8
                                  items-center
                                  gap-1
                                  rounded-[7px]
                                  border
                                  border-[#ffcaca]
                                  bg-[#fff7f7]
                                  px-2.5
                                  text-[11px]
                                  font-bold
                                  text-[#ef4444]
                                  transition
                                  hover:bg-[#fff0f0]
                                  active:scale-95
                                "
                              >
                                <Trash2
                                  size={12}
                                />
                                Delete
                              </button>
                            )}

                          </div>
                        </TableCell>

                      </tr>
                    )
                  )}

                </tbody>

              </table>

            </div>

            {/* ==================================================
                MOBILE USER CARDS
                ================================================== */}

            <div
              className="
                block
                divide-y
                divide-[#edf1f5]
                md:hidden
              "
            >

              {filteredUsers.map(
                (user) => (
                  <article
                    key={user.employeeId}
                    className="
                      p-4
                      transition
                      active:bg-[#fcfdfe]
                    "
                  >

                    {/* CARD HEADER */}

                    <div
                      className="
                        flex
                        items-start
                        justify-between
                        gap-3
                      "
                    >

                      <div
                        className="
                          flex
                          min-w-0
                          items-center
                          gap-3
                        "
                      >

                        <div
                          className="
                            flex
                            h-10
                            w-10
                            shrink-0
                            items-center
                            justify-center
                            rounded-full
                            bg-[#eefbf5]
                            text-[12px]
                            font-extrabold
                            text-[#00a86b]
                          "
                        >
                          {user.initials ||
                            getInitials(user.name)}
                        </div>

                        <div className="min-w-0">
                          <p
                            className="
                              truncate
                              text-[14px]
                              font-semibold
                              text-[#111827]
                            "
                          >
                            {user.name}
                          </p>

                          <p
                            className="
                              mt-0.5
                              text-[11px]
                              font-medium
                              text-[#66809f]
                            "
                          >
                            {formatEmployeeId(
                              user.employeeId
                            )}
                          </p>
                        </div>

                      </div>

                      {user.status === "Active" ? (
                        <span
                          className="
                            shrink-0
                            rounded-[7px]
                            bg-[#dff7ea]
                            px-2.5
                            py-1
                            text-[10px]
                            font-extrabold
                            text-[#00864b]
                          "
                        >
                          Active
                        </span>
                      ) : (
                        <span
                          className="
                            shrink-0
                            rounded-[7px]
                            bg-[#edf0f3]
                            px-2.5
                            py-1
                            text-[10px]
                            font-extrabold
                            text-[#718096]
                          "
                        >
                          Inactive
                        </span>
                      )}

                    </div>

                    {/* CARD DETAILS */}

                    <div
                      className="
                        mt-4
                        grid
                        grid-cols-1
                        gap-3
                        rounded-[10px]
                        bg-[#f8fafc]
                        p-3
                      "
                    >

                      <div className="min-w-0">
                        <p
                          className="
                            text-[9px]
                            font-extrabold
                            uppercase
                            tracking-[0.04em]
                            text-[#91a0b2]
                          "
                        >
                          Email
                        </p>

                        <p
                          className="
                            mt-1
                            break-all
                            text-[12px]
                            font-medium
                            text-[#294766]
                          "
                        >
                          {user.email}
                        </p>
                      </div>

                      <div
                        className="
                          grid
                          grid-cols-2
                          gap-3
                        "
                      >

                        <div className="min-w-0">
                          <p
                            className="
                              text-[9px]
                              font-extrabold
                              uppercase
                              tracking-[0.04em]
                              text-[#91a0b2]
                            "
                          >
                            Role
                          </p>

                          <span
                            className="
                              mt-1
                              inline-flex
                              max-w-full
                              truncate
                              rounded-[7px]
                              bg-[#eef1f4]
                              px-2
                              py-1
                              text-[10px]
                              font-bold
                              text-[#405a77]
                            "
                          >
                            {user.role}
                          </span>
                        </div>

                        <div className="min-w-0">
                          <p
                            className="
                              text-[9px]
                              font-extrabold
                              uppercase
                              tracking-[0.04em]
                              text-[#91a0b2]
                            "
                          >
                            Department
                          </p>

                          <p
                            className="
                              mt-1
                              truncate
                              text-[11px]
                              font-medium
                              text-[#294766]
                            "
                          >
                            {user.department}
                          </p>
                        </div>

                      </div>

                      <div
                        className="
                          grid
                          grid-cols-2
                          gap-3
                        "
                      >

                        <div className="min-w-0">
                          <p
                            className="
                              text-[9px]
                              font-extrabold
                              uppercase
                              tracking-[0.04em]
                              text-[#91a0b2]
                            "
                          >
                            Designation
                          </p>

                          <p
                            className="
                              mt-1
                              truncate
                              text-[11px]
                              font-medium
                              text-[#294766]
                            "
                          >
                            {user.designation}
                          </p>
                        </div>

                        <div className="min-w-0">
                          <p
                            className="
                              text-[9px]
                              font-extrabold
                              uppercase
                              tracking-[0.04em]
                              text-[#91a0b2]
                            "
                          >
                            Last Login
                          </p>

                          <p
                            className="
                              mt-1
                              truncate
                              text-[11px]
                              font-medium
                              text-[#91a0b2]
                            "
                          >
                            {formatLastLogin(
                              user.lastLogin
                            )}
                          </p>
                        </div>

                      </div>

                    </div>

                    {/* CARD ACTIONS */}

                    <div
                      className="
                        mt-3
                        grid
                        grid-cols-2
                        gap-2
                      "
                    >

                      {/* EDIT */}

                      <button
                        type="button"
                        onClick={() =>
                          handleEdit(
                            user.employeeId
                          )
                        }
                        className="
                          inline-flex
                          h-9
                          items-center
                          justify-center
                          gap-1.5
                          rounded-[8px]
                          border
                          border-[#b5ead4]
                          bg-[#f4fff9]
                          px-3
                          text-[11px]
                          font-bold
                          text-[#00a86b]
                          transition
                          hover:bg-[#e9fff4]
                          active:scale-[0.98]
                        "
                      >
                        <Pencil size={13} />
                        Edit
                      </button>

                      {/* ENABLE / DISABLE */}

                      <button
                        type="button"
                        onClick={() =>
                          handleStatusToggle(
                            user
                          )
                        }
                        className={`
                          inline-flex
                          h-9
                          items-center
                          justify-center
                          gap-1.5
                          rounded-[8px]
                          border
                          px-3
                          text-[11px]
                          font-bold
                          transition
                          active:scale-[0.98]
                          ${
                            user.status ===
                            "Active"
                              ? `
                                  border-[#ffdba8]
                                  bg-[#fffaf1]
                                  text-[#d97900]
                                  hover:bg-[#fff5df]
                                `
                              : `
                                  border-[#b5ead4]
                                  bg-[#f4fff9]
                                  text-[#00a86b]
                                  hover:bg-[#e9fff4]
                                `
                          }
                        `}
                      >
                        <Power size={13} />
                        {user.status === "Active"
                          ? "Disable"
                          : "Enable"}
                      </button>

                      {/* DELETE - ONLY FOR INACTIVE USERS */}

                      {user.status === "Inactive" && (
                        <button
                          type="button"
                          onClick={() =>
                            handleDelete(
                              user
                            )
                          }
                          className="
                            col-span-2
                            inline-flex
                            h-9
                            items-center
                            justify-center
                            gap-1.5
                            rounded-[8px]
                            border
                            border-[#ffcaca]
                            bg-[#fff7f7]
                            px-3
                            text-[11px]
                            font-bold
                            text-[#ef4444]
                            transition
                            hover:bg-[#fff0f0]
                            active:scale-[0.98]
                          "
                        >
                          <Trash2 size={13} />
                          Delete
                        </button>
                      )}

                    </div>

                  </article>
                )
              )}

            </div>

            </>

          )}

        </div>

      </main>

      {/* ======================================================
          TOAST ANIMATION
      ====================================================== */}

      <style>
        {`
          @keyframes toastIn {
            from {
              opacity: 0;
              transform: translateY(-10px) translateX(10px);
            }

            to {
              opacity: 1;
              transform: translateY(0) translateX(0);
            }
          }
        `}
      </style>

    </div>
  );
};

// ============================================================
// TABLE HEADER
// ============================================================

const TableHeader: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => (
  <th
    className="
      px-4
      py-[13px]
      text-center
      text-[11px]
      font-extrabold
      tracking-[0.02em]
      text-[#66809f]
    "
  >
    {children}
  </th>
);

// ============================================================
// TABLE CELL
// ============================================================

const TableCell: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => (
  <td
    className="
      h-[57px]
      px-4
      py-2
      align-middle
    "
  >
    {children}
  </td>
);

// ============================================================
// FORM INPUT
// ============================================================

interface FormInputProps {
  label: string;

  name:
    | "name"
    | "email"
    | "password";

  value: string;

  onChange: (
    event: React.ChangeEvent<HTMLInputElement>
  ) => void;

  placeholder: string;

  type?: string;

  error?: string;
}

const FormInput: React.FC<
  FormInputProps
> = ({
  label,
  name,
  value,
  onChange,
  placeholder,
  type = "text",
  error,
}) => (
  <div
    className="
      flex
      min-w-0
      flex-col
      gap-2
    "
  >

    <label
      htmlFor={name}
      className="
        text-[11px]
        font-extrabold
        text-[#526b87]
      "
    >
      {label}
    </label>

    <input
      id={name}
      name={name}
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      autoComplete={
        name === "password"
          ? "new-password"
          : "off"
      }
      className={`
        h-[42px]
        w-full
        rounded-[8px]
        border
        bg-white
        px-3
        text-[13px]
        text-[#243b5a]
        outline-none
        placeholder:text-[#94a1b0]
        focus:ring-2
        ${
          error
            ? "border-[#ef4444] focus:border-[#ef4444] focus:ring-[#ef4444]/10"
            : "border-[#d8dee6] focus:border-[#ff3040] focus:ring-[#ff3040]/10"
        }
      `}
    />

    {/* INLINE ERROR */}

    {error && (
      <p
        className="
          -mt-0.5
          text-[11px]
          font-semibold
          leading-4
          text-[#ef4444]
        "
      >
        {error}
      </p>
    )}

  </div>
);

// ============================================================
// FORM SELECT
// ============================================================

interface FormSelectProps {
  label: string;

  name:
    | "role"
    | "department"
    | "designation";

  value: string;

  onChange: (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => void;

  placeholder: string;

  options: string[];
}

const FormSelect: React.FC<
  FormSelectProps
> = ({
  label,
  name,
  value,
  onChange,
  placeholder,
  options,
}) => (
  <div
    className="
      flex
      min-w-0
      flex-col
      gap-2
    "
  >

    <label
      htmlFor={name}
      className="
        text-[11px]
        font-extrabold
        text-[#526b87]
      "
    >
      {label}
    </label>

    <select
      id={name}
      name={name}
      value={value}
      onChange={onChange}
      className="
        h-[42px]
        w-full
        rounded-[8px]
        border
        border-[#d8dee6]
        bg-white
        px-3
        text-[13px]
        text-[#243b5a]
        outline-none
        focus:border-[#ff3040]
        focus:ring-2
        focus:ring-[#ff3040]/10
      "
    >

      <option
        value=""
        disabled
      >
        {placeholder}
      </option>

      {options.map(
        (option) => (
          <option
            key={option}
            value={option}
          >
            {option}
          </option>
        )
      )}

    </select>

  </div>
);

export default SuperAdminUsers;