/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./templates/**/*.html",
    "./content/**/*.html",
    "./content/**/*.md",
    "./public/**/*.html",
  ],
  plugins: [
    require("tailwindcss-animate"),
  ],
}

