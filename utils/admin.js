import bcrypt from "bcryptjs";

export async function hashPassword(password) {
  const saltRounds = 10; // Recommended: 10-12 for security & performance balance
  const hashedPassword = await bcrypt.hash(password, saltRounds);
  return hashedPassword;
}

export async function verifyPassword(pass, hashedPass) {
  return await bcrypt.compare(pass, hashedPass);
}

// example usage:
// const plainTextPassword = "mySecurePassword";
// hashPassword(plainTextPassword).then((hashed) => console.log(hashed));
