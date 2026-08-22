# Question 1: Deploy and Troubleshoot an S2I Application

## Scenario

Deploy the `pastebin` Node.js application from GitLab to your local Red Hat OpenShift Local (CRC) cluster by using Source-to-Image (S2I).

The source repository contains an intentionally broken `package.json`. The initial build must fail. Diagnose the build failure, correct the source in Git, rebuild the application, expose it, and verify that it works.

## Environment

| Item | Value |
|---|---|
| Git repository | `https://gitlab.com/hits.govind/pastebin.git` |
| Git branch | `main` |
| OpenShift project | `crimson` |
| Application name | `pastebin` |
| Builder image | `nodejs:18-ubi9` |
| npm registry | `https://registry.npmjs.org/` |
| build env | npm_config_registry |
| Expected route | `pastebin-crimson.apps-crc.testing` |
| Required paste text | `This is an OpenShift Demo!` |

The training Nexus registry at `nexus-infra.apps.ocp4.example.com` is not available in this CRC environment. Configure the build to use `https://registry.npmjs.org/`.

## Requirements

1. Create the OpenShift project `crimson`.
2. Create an S2I application named `pastebin` from the `main` branch of the supplied GitLab repository.
3. Use the `nodejs:18-ubi9` builder image.
4. Configure the build with the environment variable `npm_config_registry=https://registry.npmjs.org/`.
5. Observe and diagnose the initial build failure. The failure is caused by invalid JSON in `package.json` and should report an `EJSONPARSE` error.
6. Clone the repository, correct `package.json`, and validate that it contains valid JSON.
7. Commit the correction and push it to the `main` branch.
8. Start a new OpenShift build and confirm that the image push completes successfully.
9. Confirm that the application pod is running and that the service has endpoints.
10. Expose the `pastebin` service. Use the default generated hostname or explicitly use `pastebin-crimson.apps-crc.testing`.
11. Verify the application through its route and API.
12. Create a paste containing exactly:

    ```text
    This is an OpenShift Demo!
    ```

13. Retrieve the paste and confirm that the stored text is correct.

## Environment note

CRC route resolution is a workstation/network concern, not an OpenShift application requirement. If the Fedora bastion cannot resolve the route, add the following mapping to `/etc/hosts` on that bastion:

```text
10.10.157.233 pastebin-crimson.apps-crc.testing
```

Do this only if DNS resolution fails, and confirm that `10.10.157.233` is still the current CRC ingress address.
