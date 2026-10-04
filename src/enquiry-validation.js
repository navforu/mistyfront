(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.MistfrontEnquiry = factory();
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  const REQUIRED_FIELDS = [
    "Full name",
    "Email",
    "Phone number",
    "Number of people",
    "Arrival date",
    "Departure date",
  ];

  const digitsOnly = (value) => String(value || "").replace(/\D/g, "");

  const normalizePrefix = (value) => {
    const digits = digitsOnly(value).slice(0, 3);
    return digits || "91";
  };

  const ENQUIRY_INBOX = "mistfrontvilla@gmail.com";

  const isValidEmail = (value) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());

  const emailError = (value) => {
    const trimmed = String(value || "").trim();
    if (!trimmed) return "Please fill in Email.";
    if (!isValidEmail(trimmed)) return "Please enter a valid email address.";
    if (trimmed.toLowerCase() === ENQUIRY_INBOX) {
      return "Please enter your own email address, not the Mistfront inbox.";
    }
    return "";
  };
  const phoneError = (prefixValue, numberValue) => {
    const prefix = digitsOnly(prefixValue);
    if (prefix && !/^\d{1,3}$/.test(prefix)) {
      return "Country code can have up to 3 digits.";
    }

    const number = digitsOnly(numberValue);
    if (!number) return "Please fill in Phone number.";

    const code = normalizePrefix(prefixValue);
    if (code === "91") {
      if (!/^[6-9]\d{9}$/.test(number)) {
        return "For +91, enter a 10-digit mobile number starting with 6, 7, 8, or 9.";
      }
      return "";
    }

    if (!/^\d{6,12}$/.test(number)) {
      return "Please enter a valid phone number (6–12 digits).";
    }
    return "";
  };

  const peopleError = (value) => {
    const trimmed = String(value || "").trim();
    if (!trimmed) return "Please fill in Number of people.";
    if (!/^[1-9]\d*$/.test(trimmed) || Number(trimmed) > 20) {
      return "Please enter a valid number of people (1–20).";
    }
    return "";
  };

  const dateError = (label, value, today) => {
    const trimmed = String(value || "").trim();
    if (!trimmed) return `Please fill in ${label}.`;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      return `Please choose a valid ${label.toLowerCase()}.`;
    }
    if (trimmed < today) return `${label} cannot be in the past.`;
    return "";
  };

  const departureOrderError = (arrival, departure) => {
    if (!arrival || !departure) return "";
    if (departure <= arrival) {
      return "Departure date must be after the arrival date.";
    }
    return "";
  };

  const fieldError = (fieldName, value, options = {}) => {
    const today = options.today || "1970-01-01";
    switch (fieldName) {
      case "name":
        return value && String(value).trim() ? "" : "Please fill in Full name.";
      case "email":
        return emailError(value);
      case "phone":
        return phoneError(options.prefix, value);
      case "number_of_people":
        return peopleError(value);
      case "arrival_date":
        return dateError("Arrival date", value, today);
      case "departure_date":
        return dateError("Departure date", value, today);
      default:
        return "";
    }
  };

  const buildPhoneFull = (prefixValue, numberValue) =>
    `+${normalizePrefix(prefixValue)}${digitsOnly(numberValue)}`;

  return {
    REQUIRED_FIELDS,
    digitsOnly,
    normalizePrefix,
    isValidEmail,
    emailError,
    ENQUIRY_INBOX,
    phoneError,
    peopleError,
    dateError,
    departureOrderError,
    fieldError,
    buildPhoneFull,
  };
});
