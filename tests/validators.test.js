/**
 * Unit tests for email validation
 */

const {
  isValidEmail,
  validateEmailAddresses,
} = require("../notifications/validators");

// Test valid email formats
console.log("--- Testing Valid Email Formats ---");
const validEmails = [
  "user@example.com",
  "user.name@example.com",
  "user+tag@example.com",
  "user-name@example.co.uk",
  "user123@sub.domain.co.jp",
  '"quoted.user"@example.com',
];

validEmails.forEach((email) => {
  const result = isValidEmail(email);
  console.log(`${email}: ${result ? "✓ valid" : "✗ invalid"}`);
});

// Test invalid email formats
console.log("\n--- Testing Invalid Email Formats ---");
const invalidEmails = [
  "",
  "plaintext",
  "@example.com",
  "user@",
  "user@.com",
  ".user@example.com",
  "user@example..com",
  "user@example.com.",
  "user name@example.com",
  "user@example.com,anotheruser@example.com",
];

invalidEmails.forEach((email) => {
  const result = isValidEmail(email);
  console.log(
    `${email}: ${result ? "✓ valid (unexpected)" : "✗ invalid (expected)"}`
  );
});

// Test multiple email validation
console.log("\n--- Testing Multiple Email Validation ---");
const testCases = [
  {
    input: "user1@example.com, user2@example.com",
    expected: { isValid: true },
  },
  {
    input: "user1@example.com,invalid-email",
    expected: { isValid: false, invalidCount: 1 },
  },
  {
    input: "",
    expected: { isValid: false },
  },
];

testCases.forEach((test) => {
  const result = validateEmailAddresses(test.input);
  const success =
    result.isValid === test.expected.isValid &&
    (!test.expected.invalidCount ||
      result.invalidEmails.length === test.expected.invalidCount);

  console.log(`${test.input}: ${success ? "✓ test passed" : "✗ test failed"}`);
  if (!success) {
    console.log("  Expected:", test.expected);
    console.log("  Actual:", result);
  }
});
