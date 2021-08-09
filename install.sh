NVM_HOME="$PWD/nvm"
echo " NVM_HOME='$NVM_HOME'
$(wget -qO- https://raw.githubusercontent.com/nvm-sh/nvm/v0.37.2/install.sh)" | sed -E 's/\$(HOME|\{HOME\})/$NVM_HOME/g' | bash # Installing with the specified directory

export NVM_DIR="$NVM_HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"

nvm install --latest-npm

npm install