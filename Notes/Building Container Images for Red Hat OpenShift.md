# Building Container Images for Red Hat OpenShift
## Outcomes
- Build a container image based on a Red Hat Universal Base Image (UBI).
- Push the built image to a container registry.
- Deploy the built image to Red Hat OpenShift.
- Troubleshoot permission problems in the image.

## Instructions:
Build and deploy the container image of a Node.js application, which provides greeting messages in random languages. 

The application listens on port 80 and uses a translation cache at the /var/cache directory.

| Parameter	                | Value|
| ---	                    | --- |
| Application name	        | greetings |
| Image name	            | images-ubi-greetings:1.0.0 |
| Image registry	        | registry.ocp4.example.com:8443 |
| Image registry namespace	| developer |
| Registry username	        | developer |
| Registry password	        | developer |
| Project NameSpace         | images-ubi |

### Container File
Inspect the contents of the Containerfile included in this directory. 

This file defines the instructions to build the container image for the Node.js application.
```bash
FROM registry.ocp4.example.com:8443/ubi10/nodejs-22-minimal:10.0 1

ENV PORT=80
EXPOSE ${PORT} 2

USER root 3

ADD . $HOME 4

RUN npm ci --omit=dev && rm -rf .npm

CMD npm start
```

## Tasks: 
```bash
1. Log in to the container registry.
2. Build the container image with Podman.
3. Push the container image to the internal classroom registry.
4. Deploy the image to the cluster and verify that the container fails.
5. Log in to the cluster as the developer user.
6. Ensure that you use the images-ubi project.
7. Create an application in the cluster by using the image that you just built. Call the application greetings.
8. Verify that the application pod is crashing. View the deployment logs and find out why the application fails to start.
9. Remove the application and its associated resources.
10. Reproduce the problem locally by running the application as a non-root user.
11. Rebuild the application image and tag it as version 1.0.1 and run the new container image.
12. Deploy the fixed image to the cluster. Rebuild the application image as version 1.0.1.
13. Find the application pod and inspect the logs. Verify that the logs do not show any problems.
14. Expose the application. Get the route URL. Make a request to verify that the application responds successfully.
```

## Solution:
### Steps 1 - 9
```bash
# 1. Log in to the container registry.
podman login -u developer -p developer registry.ocp4.example.com:8443

# 2. Build the container image with Podman.
podman build . -t registry.ocp4.example.com:8443/developer/images-ubi-greetings:1.0.0

# 3. Push the container image to the internal classroom registry.
podman push registry.ocp4.example.com:8443/developer/images-ubi-greetings:1.0.0

# 4. Deploy the image to the cluster and verify that the container fails.
# 5. Log in to the cluster as the developer user.
# 6. Ensure that you use the images-ubi project.
# 7. Create an application in the cluster by using the image that you just built. Call the application greetings.
# 8. Verify that the application pod is crashing. View the deployment logs and find out why the application fails to start.

oc login -u developer -p developer https://api.ocp4.example.com:6443

oc project images-ubi

oc new-app --name greetings --image=registry.ocp4.example.com:8443/developer/images-ubi-greetings:1.0.0

oc get pods # Pod is crashlooping

oc logs deployments/greetings

# The pod crashloops, because...
# 1. The cluster runs the container with a non-root user and the root group.
# 2. The application does not have the right access to the /var/cache directory.
# 3. The application cannot use the privileged port 80.

# 9. Remove the application and its associated resources.
oc delete all -l selector app=greetings
```

### Steps 10
```bash
# 10. Reproduce the problem locally by running the application as a non-root user.
podman run --rm registry.ocp4.example.com:8443/developer/images-ubi-greetings:1.0.0 # Container runs because podman containers can run as root
```

### Steps 12
```bash
# 11. Rebuild the application image and tag it as version 1.0.1 and run the new container image.
FROM registry.ocp4.example.com:8443/ubi10/nodejs-22-minimal:10.0 1

ENV PORT=80
EXPOSE ${PORT} 2

ADD . $HOME 4

RUN npm ci --omit=dev && rm -rf .npm

USER root
RUN chgrp -R 0 /var/cache && \
    chmod -R g=u /var/cache
USER 1001

CMD npm start
```

### Steps 12 - 14
```bash
# 12. Deploy the fixed image to the cluster. Rebuild the application image as version 1.0.1.
podman build . -t registry.ocp4.example.com:8443/developer/images-ubi-greetings:1.0.1

podman run --rm registry.ocp4.example.com:8443/developer/images-ubi-greetings:1.0.1

podman push registry.ocp4.example.com:8443/developer/images-ubi-greetings:1.0.1

oc new-app --name greetings --image=registry.ocp4.example.com:8443/developer/images-ubi-greetings:1.0.1

# 13. Find the application pod and inspect the logs. Verify that the logs do not show any problems.
oc get pods

oc logs deployments/greetings

# 14. Expose the application. Get the route URL. Make a request to verify that the application responds successfully.
oc expose svc/greetings

oc get route

curl -s http://greetings-images-ubi.apps.ocp4.example.com | jq
```