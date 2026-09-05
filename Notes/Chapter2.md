# Chapter 2 - Deploying Cloud Native Applications
---

## Commands

```bash
# Get API details
oc whoami --show-server

# Shows Web URL
oc whoami --show-console

# Login using username and password and logging in using token
oc login -u developer -p developer https://api.ocp4.example.com:6443
oc login -u developer -p $(oc whoami -t) https://api.ocp4.example.com:6443

# Get all details in project (services, deployments, replicasets, imagestreams)
oc get all

# Deletes everything with app=hello
oc delete all --selector app=hello

# Expose Service
oc expose svc/<service_name>
```