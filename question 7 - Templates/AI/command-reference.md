# Question 7 — Command reference

## Template registration and inspection

```bash
oc project indy
oc apply -f php-app.yaml                         # Store the Template.
oc get template ex288-php-mysql --show-labels
oc process --parameters ex288-php-mysql           # List parameters.
```

## Instantiate

```bash
oc new-app --template=ex288-php-mysql \
  -p NAME=php-app \
  -p HELLO_MESSAGE=Namaste \
  -p HELLO_AUDIENCE=Architects \
```

For a preview instead of creation, use `oc process ex288-php-mysql` with the same `-p` arguments. Previewing does not build or deploy anything.

## Verify and diagnose

```bash
oc logs -f bc/php-app

oc get builds -l buildconfig=php-app

oc rollout status deployment/php-app --timeout=5m

oc get pods -l name=php-app

oc set env deployment/php-app --list

oc get route

curl http://php-app-indy.apps-crc.testing
```
