# Question 7 — Essential theory

## Templates and parameters

A Template stores resource definitions and parameters. Registering it with `oc apply` makes it reusable; `oc new-app --template` processes values and creates the application resources. `oc process` renders objects without deploying them.

A parameter can use a default or a supplied value. `required: true` demands a value; it does not mean the caller must override a valid default. An empty context directory is appropriate when application files are at the Git repository root.

## Two kinds of labels

`metadata.labels` belongs to the Template resource. Top-level `labels` is applied to generated objects during processing. They serve different purposes. See the [Template API source in README.md](README.md#sources).

## Application relationships

The BuildConfig combines Git source with the PHP builder. It publishes the result to ImageStream `php-app:latest`. The Deployment runs two replicas of that image. The Service selects their `name=php-app` label and forwards to port 8080; the Route exposes that Service.

The PHP code reads `HELLO_MESSAGE` and `HELLO_AUDIENCE` at runtime. The Deployment therefore needs those environment variables, even though this template also passes them into the build.

The `NAMESPACE` parameter identifies where the builder ImageStream lives. It does not change the selected application project. Here both are `indy` because preparation imports a project-local builder.

## Exam reminders

- The catalog title comes from `openshift.io/display-name`; it can differ from the Template resource name.
- Names and descriptions are not proof of resources: this “PHP + MySQL” template contains no database or persistent storage.
- Build completion, ready replicas, and the correct HTTP greeting are separate checks.
- A Deployment referencing an image tag does not itself guarantee an automatic rollout on future tag updates. This exercise verifies the first deployment.
