# Building Applications
oc new-app can consume source code, images, ImageStreams, or templates — and the syntax changes depending on which one you're using.

## From a GIT Repo
```bash
# OpenShift will inspect the source and try to determine the appropriate builder.
oc new-app --name=todo-app https://gitlab.com/hits.govind/todo-app.git

# Specific branch:
oc new-app --name=todo-app https://gitlab.com/hits.govind/todo-app.git#main

# Specific branch + Context Dir
oc new-app --name=todo-app https://gitlab.com/hits.govind/todo-app.git#main --context-dir=backend

# Explicitly specify a builder ImageStream: (builder image ~ source repository)
oc new-app openshift/nodejs:18-ubi9~https://gitlab.com/hits.govind/todo-app.git --name=todo-app

# Specifying Repo Secret (Secret must be created and linked first)
oc new-app https://gitlab.com/private/repo.git --source-secret=git-secret
```

## From a Container Image using an ImageStream
```bash
# Confirm the availability of an imagestream
oc get is # Assume there is an imagestream called custom-server1.0.0
oc new-app --name=custom-server custom-server:1.0.0
```

## From a Container Image in an External Registry
```bash
oc new-app --name=todo-list registry.ocp4.example.com:8443/redhattraining/openshift-dev-deploy-review-todo-list
oc new-app --name=nginx quay.io/nginx/nginx:latest
```

## From the Catalog, for example PostgreSQL
```bash
# First search what's available: e.g postgresql
oc new-app --search postgresql # or
oc get templates -n openshift | grep -i postgres 

# New App with variables, (postgresql-ephemeral is from the OpenShift Catalog). Use the -p option for setting a template parameter
oc new-app postgresql-ephemeral --name=postgresql \
  -p POSTGRESQL_USER=appuser \
  -p POSTGRESQL_PASSWORD=redhat \
  -p POSTGRESQL_DATABASE=appdb

# Create DB credetials, for an app
oc new-app registry.example.com/myapp:1.0 --name=myapp \
  -e POSTGRESQL_USER=appuser \
  -e POSTGRESQL_PASSWORD=redhat \
  -e POSTGRESQL_DATABASE=appdb
```