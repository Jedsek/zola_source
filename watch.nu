#!/usr/bin/nu

task spawn -i {npx tailwindcss -i input.css -o static/styles/custom/tailwind.css --minify --watch}
task spawn -i {zola serve}

