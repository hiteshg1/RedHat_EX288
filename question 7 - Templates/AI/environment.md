# Question 7 — Environment setup

This prepares source, builder, and materials server only. It must not register the exam Template or create application `php-app`.

## Prerequisites

Use a running OpenShift 4.18 CRC with its internal registry enabled, a 4.18 `oc` client, Git, curl, and permission to create project resources. Cluster access to GitLab and Red Hat images is required. The workstation must resolve `*.apps-crc.testing`.

```bash
oc version
oc whoami
oc cluster-info
```

Use an otherwise clean `indy` project for a fresh attempt. If continuing in your existing `indy`, preserve unrelated resources and check that `php-app` resources will not conflict; these instructions do not delete previous work.

## Source repository

If the repository already contains the supplied application on `main`, use it unchanged. Otherwise create a blank public GitLab project `hits.govind/php-greeting-app` without initializing files, then from your study directory:

```bash
mkdir php-greeting-app
cd php-greeting-app
git init -b main
git remote add origin https://gitlab.com/hits.govind/php-greeting-app.git
```

Run the complete `index.php` creation block in the supplied **question7.md → Environment Setup → Step 3** unchanged. Then:

```bash
git add index.php
git commit -m "Prepare PHP greeting application"
git push -u origin main
```

Use your Git credential helper for authentication. For an existing repository, clone with `git clone --branch main https://gitlab.com/hits.govind/php-greeting-app.git`; Git clone does not accept `#main` as a URL branch selector.

## Project and builder

For a fresh lab:

```bash
oc new-project indy
```

For an already prepared project, use `oc project indy` instead. Import a builder without depending on cluster-wide sample ImageStreams:

```bash
oc import-image php:8.2 \
  --from=registry.access.redhat.com/ubi9/php-82:latest --confirm
oc get istag/php:8.2
```

Continue only when the imported image is available. This modern builder replaces the source material's assumed PHP 7.4 tag; the supplied greeting code is unchanged.

## Materials server

Create a local `materials` directory and save the following as `materials/php-app.yaml`. Only the source repository URL is adapted here. The original labels and parameter defaults remain for the candidate to inspect; no application is deployed. This complete template contains nine parameters and five objects.

```yaml
apiVersion: template.openshift.io/v1
kind: Template
labels:
  template: "wrong-label"
  app: "php-application"
metadata:
  name: ex288-php-mysql
  labels:
    template: "wrong-label"
  annotations:
    openshift.io/display-name: "PHP + MySQL (Persistent)"
    description: "A simple two-tier application to demonstrate a CI/CD pipeline from scratch."
    tags: "quickstart,php"
    iconClass: "icon-php"
    openshift.io/long-description: "This template defines resources for a LAMP application, including a build configuration, application deployment configuration, and database deployment configuration with persistent storage."
parameters:
  - name: NAME
    displayName: Name
    description: The name assigned to all of the frontend objects
    required: false
    value: lamp-app
  - name: HELLO_AUDIENCE
    displayName: Greeting Audience
    description: Who should we greet?
    required: false
    value: Engineers
  - name: HELLO_MESSAGE
    displayName: Greeting Message
    description: The greeting message
    required: false
    value: Bonjour
  - name: NAMESPACE
    displayName: Namespace
    description: The OpenShift Namespace where the ImageStream resides
    required: false
    value: openshift
  - name: APPLICATION_DOMAIN
    displayName: Application Hostname
    description: The exposed hostname that will route to the PHP service
    required: false
  - name: SOURCE_REPOSITORY_URL
    displayName: Git Repository URL
    description: The URL of the repository with your application source code
    required: false
    value: https://gitlab.com/hits.govind/php-greeting-app.git
  - name: SOURCE_REPOSITORY_REF
    displayName: Git Reference
    description: Set this to a branch name, tag or other ref of your repository
    value: main
  - name: CONTEXT_DIR
    displayName: Context Directory
    description: Set this to the relative path to your project if it is not in the root
  - name: PHP_VERSION
    displayName: PHP Version
    description: Version of PHP to be used
    required: false
    value: "7.4-ubi8"
objects:
  - apiVersion: v1
    kind: Service
    metadata:
      name: ${NAME}
      annotations:
        description: Exposes and load balances the application pods
    spec:
      ports:
        - name: web
          port: 8080
          targetPort: 8080
      selector:
        name: ${NAME}
  - apiVersion: route.openshift.io/v1
    kind: Route
    metadata:
      name: ${NAME}
    spec:
      host: ${APPLICATION_DOMAIN}
      to:
        kind: Service
        name: ${NAME}
  - apiVersion: image.openshift.io/v1
    kind: ImageStream
    metadata:
      name: ${NAME}
      annotations:
        description: Keeps track of changes in the application image
  - apiVersion: build.openshift.io/v1
    kind: BuildConfig
    metadata:
      name: ${NAME}
      annotations:
        description: Defines how to build the application
        template.alpha.openshift.io/wait-for-ready: "true"
    spec:
      source:
        type: Git
        git:
          uri: ${SOURCE_REPOSITORY_URL}
          ref: ${SOURCE_REPOSITORY_REF}
        contextDir: ${CONTEXT_DIR}
      strategy:
        type: Source
        sourceStrategy:
          from:
            kind: ImageStreamTag
            namespace: ${NAMESPACE}
            name: php:${PHP_VERSION}
          env:
            - name: HELLO_MESSAGE
              value: ${HELLO_MESSAGE}
            - name: HELLO_AUDIENCE
              value: ${HELLO_AUDIENCE}
      output:
        to:
          kind: ImageStreamTag
          name: ${NAME}:latest
      triggers:
        - type: ImageChange
        - type: ConfigChange
  - apiVersion: apps/v1
    kind: Deployment
    metadata:
      name: ${NAME}
      annotations:
        description: Defines how to deploy the application
        template.alpha.openshift.io/wait-for-ready: "true"
    spec:
      replicas: 2
      selector:
        matchLabels:
          name: ${NAME}
      template:
        metadata:
          labels:
            name: ${NAME}
        spec:
          containers:
            - name: php-app
              image: image-registry.openshift-image-registry.svc:5000/indy/${NAME}:latest
              ports:
                - containerPort: 8080
              env:
                - name: HELLO_MESSAGE
                  value: ${HELLO_MESSAGE}
                - name: HELLO_AUDIENCE
                  value: ${HELLO_AUDIENCE}
```

From that directory, in project `indy`:

```bash
oc create configmap php-materials --from-file=php-app.yaml
oc new-app --name=fileserver --docker-image=registry.access.redhat.com/ubi9/httpd-24:latest
oc set volume deployment/fileserver --add --name=content \
  --type=configmap --configmap-name=php-materials \
  --mount-path=/var/www/html/files
oc expose service/fileserver
oc rollout status deployment/fileserver --timeout=5m
```

Keep the file name `php-app.yaml`: it becomes the ConfigMap key and served filename. The mount supplies `/var/www/html/files/php-app.yaml` to the HTTP server. No separate application database or PVC is needed.

## Confirm readiness

```bash
oc get istag/php:8.2
oc get deployment/fileserver svc/fileserver route/fileserver
curl --fail http://fileserver-indy.apps-crc.testing/files/php-app.yaml
git ls-remote https://gitlab.com/hits.govind/php-greeting-app.git refs/heads/main
```

Confirm HTTP returns the complete Template YAML, the builder tag resolves, and Git returns a SHA for `main`. Leave the candidate Template unregistered and `php-app` undeployed. Continue with [question.md](question.md).
