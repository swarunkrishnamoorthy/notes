# Options
setopt interactive_comments

# Colors
export CLICOLOR=1
export LSCOLORS="EHfxcxdxBxegecabagacad"
alias ls='ls --color=auto'

# Manual Plugin Loading
source ~/.zsh/zsh-autosuggestions/zsh-autosuggestions.zsh
source ~/.zsh/zsh-syntax-highlighting/zsh-syntax-highlighting.zsh

# Git
export GIT_COMPLETION_CHECKOUT_NO_REMOTES=1

# Path
export PATH="$PATH:/Applications/Docker.app/Contents/Resources/bin/"
export PATH=$PATH:$HOME/Library/Python/3.9/bin
export PATH=$PATH:$HOME/.foreman/bin
export PATH=$PATH:$HOME/.local/bin
export PATH=$PATH:$HOME/.dotnet/tools
export PATH="/usr/local/share/dotnet:/opt/homebrew/opt/dotnet@8/bin:$PATH"

eval "$(fnm env --use-on-cd --version-file-strategy=recursive --shell zsh)"

# Lazy load NVM (only when needed) - Fast startup!
export NVM_DIR="$HOME/.nvm"
export NVM_LAZY_LOAD=true
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion

# Optional: Load iTerm2 integration if running in iTerm2
if [[ "$TERM_PROGRAM" == "iTerm.app" ]]; then
    test -e "${HOME}/.iterm2_shell_integration.zsh" && source "${HOME}/.iterm2_shell_integration.zsh"
fi

gs() {
  # 1. Get branches, let user select via fzf, clean the output
  local selected_branch
  selected_branch=$(git branch | fzf | tr -d '[:space:]*')

  # 2. Check if a branch was actually selected (fzf cancelled?)
  if [ -n "$selected_branch" ]; then
    # 3. Switch to the selected branch
    git switch "$selected_branch"
  else
    # Optional: Inform the user if they cancelled fzf
    echo "No branch selected."
    return 1 # Indicate failure
  fi
}
