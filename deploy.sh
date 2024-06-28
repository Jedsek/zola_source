#!/usr/bin/env bash

cd $(dirname $0)

blog_dir=$(pwd)
git_deploy_repo=$(grep git_deploy_repo= $blog_dir/.env | cut -d '=' -f2)

npx tailwindcss -i input.css -o static/styles/custom/tailwind.css --minify
zola build

cd public

git init
git remote add origin $git_deploy_repo
git branch -m main
git add .
git commit -m "update"
git push origin main -f
