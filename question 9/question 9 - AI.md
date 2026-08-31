# Question 9: Access the OpenShift Internal Image Registry

## Administrator Preparation

Complete these steps before the learner begins.

1. Enable the default external route for the integrated image registry:

```bash
oc patch configs.imageregistry.operator.openshift.io/cluster \
  --type=merge \
  -p '{"spec":{"defaultRoute":true}}'
```

2. Wait for the route, then record its hostname:

```bash
oc get route default-route -n openshift-image-registry \
  -o jsonpath='{.spec.host}{"\n"}'
```

3. Provide the learner with this registry hostname.

4. Ensure the learner can create and manage resources in the `registry-practice` project. The learner does not need cluster-administrator access.

> For CRC or lab hosts, ensure the learner machine can resolve the registry route hostname. Add the route hostname to DNS or `/etc/hosts` if necessary.

---

## Learner Question

Use the OpenShift integrated image registry to create and pull an image.

The registry hostname is provided by the lab administrator as:

```text
default-route-openshift-image-registry.apps-crc.testing
```

Complete the following tasks:

- Create or use the project `registry-practice`.
- Import `registry.access.redhat.com/ubi8/ubi-minimal:latest` into an ImageStream named `sample-image`.
- Log in to the integrated image registry with Podman, using your OpenShift user token.
- Pull `sample-image:latest` from the integrated registry with Podman.
- Verify the image appears in your local Podman image list.

---

## Solution

### 1. Create or select the project

```bash
oc new-project registry-practice 2>/dev/null || oc project registry-practice
```

### 2. Import the sample image

```bash
oc import-image sample-image:latest \
  --from=registry.access.redhat.com/ubi8/ubi-minimal:latest \
  --confirm
```

Verify the ImageStream:

```bash
oc get imagestream sample-image
oc get istag sample-image:latest
```

### 3. Log in to the integrated registry

Set the hostname supplied by the administrator:

```bash
REGISTRY_ROUTE=<registry-route>
```

Authenticate as the current OpenShift user:

```bash
podman login \
  -u "$(oc whoami)" \
  -p "$(oc whoami -t)" \
  "$REGISTRY_ROUTE" \
  --tls-verify=false
```

### 4. Pull the image

```bash
podman pull \
  "$REGISTRY_ROUTE/registry-practice/sample-image:latest" \
  --tls-verify=false
```

### 5. Verify the local image

```bash
podman images | grep sample-image
```

## Success Criteria

- The integrated registry default route is enabled by the administrator.
- The `sample-image` ImageStream exists in `registry-practice`.
- Podman authenticates using the learner’s OpenShift token.
- Podman pulls `sample-image:latest` through the integrated registry route.
- The pulled image appears in `podman images`.

For your CRC environment, the administrator-preparation step should also ensure that the `default-route-openshift-image-registry.apps-crc.testing` hostname resolves to the CRC ingress IP on the learner’s machine.