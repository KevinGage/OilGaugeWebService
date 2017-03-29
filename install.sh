#!/bin/bash
checkIfSudo ()
{
	#This makes sure the install script was run with sudo.  It requires root for some actions.  
        if [ "$(whoami)" != 'root' ]
        then
                printf "You forgot sudo..."
                exit 1
        else
                return 0
        fi
}

installNode6 ()
{
	#This installs node 6 using apt https://nodejs.org/en/download/package-manager/
	curl -sL https://deb.nodesource.com/setup_6.x | sudo -E bash -
	apt-get install -y nodejs
	apt-get install -y build-essential
}

installMYSQL ()
{
	apt-get install -y mysql-server
	mysql_secure_installation
	systemctl enable mysql
}

promptNode6Install()
{
	clear
	read -p "Node version 6 is not installed but is required.  Would you like this script to install it for you? Warning this could replace your current version of nodejs with version 6.\n" yn
                case $yn in
                        [Yy]* ) installNode6;;
                        [Nn]* ) exit;;
                * ) printf "Please answer yes to attempt to install node or no to quit.\n";;
        esac
}

checkPrerequisites ()
{
	#Make sure node version 6 and npm are installed.  If not this should ask if you want to install.
	[[ $(node -v) =~ "v6." ]] || promptNode6Install

	#Check for npm just in case	
	command -v npm >/dev/null 2>&1 || { echo >&2 "Npm is not installed.  Please install the npm package and run setup again.  https://nodejs.org/en/download/package-manager/  Aborting."; exit 1; }

	#Check for mysql
	if mysql -V | grep --quiet "Ver" 	
	then
		printf "My SQL is already installed.\n"
	else
		installMYSQL
	fi
}

collectInformation ()
{
	#This asks the user a series of questions used to setup the config file.
	clear
	printf "Enter a password for the oil database service account user:\n"
	read databaseServicePassword
	clear
	printf "Enter a password for the database sa account:\n"
        read databaseSaPassword
}

createDatabase ()
{
	#This should create the MYSWL database
	 mysql -uroot -p${mySqlPassword} -e "CREATE DATABASE OilGaugeWebService;"

	
}

checkIfSudo
collectInformation
checkPrerequisites
