# Solution 1: Deploy and Troubleshoot an S2I Application

## 1. Create the project

```bash
oc new-project crimson
```

## 2. Create the S2I application

Create the application from the `main` branch and point npm at the public registry:

Before creating the app, the CRC environment needs proxy for GIT and the NPM build...this is only for the lab environment. They do not survive a project delete

### Git Proxy Patch
```bash
oc patch bc/pastebin --type=merge -p '{
  "spec": {
    "source": {
      "git": {
        "httpProxy": "http://10.10.152.62:3128",
        "httpsProxy": "http://10.10.152.62:3128",
        "noProxy": "localhost,127.0.0.1,.svc,.cluster.local,.apps-crc.testing,api.crc.testing,10.10.157.233,10.217.4.1"
      }
    }
  }
}'
```

### NPM Proxy Patch
```bash
oc set env bc/pastebin \
  HTTP_PROXY=http://10.10.152.62:3128 \
  HTTPS_PROXY=http://10.10.152.62:3128 \
  NO_PROXY=localhost,127.0.0.1,.svc,.cluster.local,.apps-crc.testing,api.crc.testing,10.10.157.233,10.217.4.1 \
  npm_config_registry=https://registry.npmjs.org/
```

```bash
oc new-app nodejs:18-ubi9~https://gitlab.com/hits.govind/pastebin.git#main \
  --name=pastebin \
  --build-env npm_config_registry=https://registry.npmjs.org/
```

Follow the first build:

```bash
oc logs -f bc/pastebin
```

The build is expected to fail. In the npm output, identify an error similar to:

```text
npm ERR! code EJSONPARSE
```

This confirms that npm cannot parse `package.json`.

Useful confirmation commands are:

```bash
oc get builds
oc describe build pastebin-1
oc logs build/pastebin-1
```

## 3. Fix and validate the source

Work in a suitable practice directory:

```bash
git clone https://gitlab.com/hits.govind/pastebin.git
cd pastebin
git switch main
```

Open `package.json`, locate the deliberate JSON syntax error, and correct it. Then validate the file before committing:

```bash
npm pkg get name
```

Alternatively, if Python is available:

```bash
python3 -m json.tool package.json >/dev/null
```

Both commands should complete without a JSON parsing error.

Commit and push the corrected file:

```bash
git add package.json
git commit -m "Fix invalid package.json"
git push origin main
```

## 4. Rebuild from the corrected commit

Start and follow a new build:

```bash
oc start-build pastebin --follow
```

The log should finish with a successful image push, including output similar to `Push successful`.

Confirm the build status:

```bash
oc get builds
```

## 5. Verify the workload and service

Wait for the deployment to become available:

```bash
oc rollout status deployment/pastebin
oc get pods
oc get svc pastebin
oc get endpoints pastebin
```

The application pod should be `Running`, and the service should have at least one endpoint.

If the generated resource is a deployment configuration rather than a deployment, use:

```bash
oc rollout status dc/pastebin
```

## 6. Expose the service

Use the default CRC hostname:

```bash
oc expose svc/pastebin
```

Or specify the expected hostname explicitly:

```bash
oc expose svc/pastebin --hostname=pastebin-crimson.apps-crc.testing
```

Do not run both commands. If a route already exists, inspect or edit that route instead.

Get the assigned hostname:

```bash
oc get route pastebin
ROUTE_HOST=$(oc get route pastebin -o jsonpath='{.spec.host}')
printf '%s\n' "$ROUTE_HOST"
```

## 7. Verify the application and API

Check the application root:

```bash
curl -i "http://${ROUTE_HOST}/"
```

Inspect the application's API contract if necessary. For example:

```bash
curl -i "http://${ROUTE_HOST}/api"
```

Use the API paths and JSON field names implemented by the supplied application. A typical paste creation request is:

```bash
curl -i -X POST \
  -H 'Content-Type: application/json' \
  -d '{"text":"This is an OpenShift Demo!"}' \
  "http://${ROUTE_HOST}/api/pastes"
```

Record the identifier or retrieval URL returned by the API, then retrieve the paste. For example:

```bash
PASTE_ID='<identifier-returned-by-the-create-request>'
curl -i "http://${ROUTE_HOST}/api/pastes/${PASTE_ID}"
```

The response must contain exactly:

```text
This is an OpenShift Demo!
```

If the repository implements a different endpoint or request field, confirm it from the application source or its root/API response and adjust only the endpoint-specific portions of the two `curl` commands.

## CRC route-resolution troubleshooting

From the machine issuing `curl`, first test resolution:

```bash
getent hosts pastebin-crimson.apps-crc.testing
```

If the Fedora bastion cannot resolve the CRC route, add this entry on the bastion:

```text
10.10.157.233 pastebin-crimson.apps-crc.testing
```

For example, with appropriate administrative access:

```bash
echo '10.10.157.233 pastebin-crimson.apps-crc.testing' | sudo tee -a /etc/hosts
```

This is local name-resolution troubleshooting; it is not part of the OpenShift deployment. Confirm the CRC ingress IP before adding the entry if the CRC instance has been recreated or its network has changed.

## Reset the lab

Delete the deployment pastebin
```
oc delete deployment pastebin
```

Delete the project
```
oc delete project crimson
```
