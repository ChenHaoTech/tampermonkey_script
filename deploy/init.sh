#!/bin/bash

echo "init..."


scriptpath="./deploy/dav"

cd $scriptpath

if [ ! -e "config.json" ]
then
    npm install
    mkdir src 2>/dev/null

    cat > config.json <<EOL
{
    "path": "./src",
    "meta-touch": true,
    "open-in-editor": true
}
EOL
fi

node server.js $@

# 如果不成功, 就返回
if [ $? -ne 0 ]
then
    exit -1
fi

echo "init dav success"
echo "open chrome-extension://dhdgffkkebhmkfjojejmpbldmpobfkfo/options.html#nav=settings , update webdev config"
echo "more doc : https://github.com/Tampermonkey/TamperDAV#user-content-tamperdav"
