# Portable zsh configuration

```zsh
#!/bin/zsh

setopt interactive_comments

export CLICOLOR=1
export LSCOLORS="EHfxcxdxBxegecabagacad"
alias ls='ls --color=auto'

source ~/.zsh/zsh-autosuggestions/zsh-autosuggestions.zsh
source ~/.zsh/zsh-syntax-highlighting/zsh-syntax-highlighting.zsh

export GIT_COMPLETION_CHECKOUT_NO_REMOTES=1
export PATH="$PATH:/Applications/Docker.app/Contents/Resources/bin"
export PATH="$PATH:$HOME/.local/bin:$HOME/.dotnet/tools"

eval "$(fnm env --use-on-cd --version-file-strategy=recursive --shell zsh)"

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
[ -s "$NVM_DIR/bash_completion" ] && . "$NVM_DIR/bash_completion"

if [[ "$TERM_PROGRAM" == "iTerm.app" ]]; then
  test -e "${HOME}/.iterm2_shell_integration.zsh" &&
    source "${HOME}/.iterm2_shell_integration.zsh"
fi

gs() {
  local selected_branch
  selected_branch=$(git branch | fzf | tr -d '[:space:]*')
  if [[ -n "$selected_branch" ]]; then
    git switch "$selected_branch"
  else
    echo "No branch selected."
    return 1
  fi
}
```
