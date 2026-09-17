# Triggering Builds
## Outcomes
- Deploy an application by using a builder image and a source code.
- Trigger a new build of the application when the builder image changes.

## Instructions
Use the following as the input data for the required actions:

| Parameter                     | Value |
| ---	                        | --- |
| Git Repo                      | https://git.ocp4.example.com|
| Git Username              	| developer |
| Git Password                  | d3v3lop3r |
| Git Namespace                 | developer |
| Git Project                   | builds-triggers.git |
| Source Image                  | registry.ocp4.example.com:8443/ubi8/httpd-24 |


## Tasks / Solutions
```bash
# 1. Create a new project in GitLab.
Open a browser and go to https://git.ocp4.example.com.

Log in to GitLab by using the developer username with password d3v3lop3r.

Click New project, and then click Create blank project.

Type builds-triggers in the Project name field. In the Visibility Level area, click Private. Clear the Initialize repository with a README checkbox, and finally click Create project.

# 2. Clone the git repository as the developer user identified with password d3v3lop3r.
git clone https://git.ocp4.example.com/developer/builds-triggers.git

# 3. Create the index.html file. Commit the index.html file, and push the content into the git repository:
echo "Hello world!" > index.html

git add index.html

git commit -m "Initial commit"

git push

# 4. Deploy the application. Create a secret named gitlab to store the GitLab credentials.
oc create secret generic gitlab --from-literal=username=developer --from-literal=password=d3v3lop3r

oc new-app --name builds-triggers --source-secret gitlab registry.ocp4.example.com:8443/ubi8/httpd-24~https://git.ocp4.example.com/developer/builds-triggers

# 5. Verify that the current application uses an ubi8 image.
oc rsh svc/builds-triggers cat /etc/redhat-release

# 6. Verify that the image change trigger is set:
oc set triggers bc/builds-triggers

# 7. Tag the httpd-24 image based on ubi9 as the latest version of the builder image:
 oc tag registry.ocp4.example.com:8443/ubi9/httpd-24:latest httpd-24:latest

# 8. Use the oc describe command to verify the latest tag:
oc describe is httpd-24

# 9. Verify that the image change has triggered a new build:
oc get builds

# 10. Verify that the current application uses a ubi9 image:
oc rsh svc/builds-triggers cat /etc/redhat-release
```