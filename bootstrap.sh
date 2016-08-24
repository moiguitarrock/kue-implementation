sudo yum -y update

curl --silent --location https://rpm.nodesource.com/setup_6.x | bash -
yum -y install nodejs

rpm -Uvh http://download.fedoraproject.org/pub/epel/6/x86_64/epel-release-6-8.noarch.rpm
rpm -Uvh http://rpms.famillecollet.com/enterprise/remi-release-6.rpm
yum --enablerepo=remi,remi-test install redis

npm install pm2 -g

cd /vagrant
npm install

sudo chmod 777 -R /var/log
