#!/bin/sh
BASE_PATH="ssh_script/"
TEST_SERVER_PATH=$BASE_PATH"test_server"
REAL_SERVER_PATH=$BASE_PATH"real_server"

sleep 1

if [ "$1" = "real" ]; then
    LIST_PATH=$REAL_SERVER_PATH"/server_list"
    LOG_PATH=$REAL_SERVER_PATH"/server.log"
else
    LIST_PATH=$TEST_SERVER_PATH"/server_list"
    LOG_PATH=$TEST_SERVER_PATH"/server.log"
fi

echo $LIST_PATH
echo $LOG_PATH

if [ "$2" = "stop" ]; then
    COMMAND="cd api && ./server_stop.sh"
else
    COMMAND="cd api && ./server_start.sh"
fi

echo $COMMAND
sleep 1

echo "[COMMAND] ""\"${COMMAND}\""

pwd

while IFS= read -r LINE; do
  echo "[LINE]"
  sleep 1
  $LINE "$COMMAND" < /dev/null >> $LOG_PATH &
  if [ "$?" -eq 0 ]; then
    echo "success"
  else
    echo "fail"
  fi
done < $LIST_PATH
sleep 5

