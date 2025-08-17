ssh -i "test.pem" ubuntu@ec2-13-127-23-39.ap-south-1.compute.amazonaws.com

rsync -avz \
 --exclude 'node_modules' \
 --exclude '.git' \
 -e "ssh -i /c/Users/user-name/.ssh/test.pem" \
 ubuntu@ec2-13-127-23-39.ap-south-1.compute.amazonaws.com:~/app

scp -i "C:\Users\user-name\.ssh\test.pem" -r .\* ` ubuntu@ec2-13-127-23-39.ap-south-1.compute.amazonaws.com:~/app

sudo nano /etc/systemd/system/pravesh-backend.service
sudo systemctl daemon-reload
sudo systemctl enable pravesh-backend.service
sudo systemctl start pravesh-backend.service
