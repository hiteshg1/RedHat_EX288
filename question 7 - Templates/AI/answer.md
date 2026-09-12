# Answer 7

## Solution

```bash
oc project indy
curl --fail -o php-app.yaml http://fileserver-indy.apps-crc.testing/files/php-app.yaml
vi php-app.yaml
```

Keep `metadata.name: ex288-php-mysql`. Change `template: wrong-label` to `template: php-app` in both `metadata.labels` and the top-level `labels` section. The first meets the Template-label requirement; the second keeps generated object labels consistent. Leave the other template content intact.

```bash
oc apply -f php-app.yaml

oc new-app --template=ex288-php-mysql \
  -p HELLO_MESSAGE=Namaste \
  -p HELLO_AUDIENCE=Architects

oc logs -f bc/php-app
```

`NAMESPACE` selects the builder ImageStream's project. It is separate from the application project selected by `oc project`. Leave `CONTEXT_DIR` blank because `index.php` is at the repository root. No blanket change to `required` flags is needed.

## Verification

```bash
oc get template ex288-php-mysql --show-labels

oc get builds

oc rollout status deployment/php-app

oc get pods

oc get route

curl --fail --show-error http://php-app-indy.apps-crc.testing
```

Confirm the Template label is `template=php-app`, the build is `Complete`, both application Pods are `Running` and ready, the Route has the requested host, and HTML contains **Namaste Architects!**. If the build is still running, wait for it to complete before judging the rollout.

## GUI alternative

The CLI is quickest for the whole task; the GUI is useful for entering parameters after uploading the edited template.

In project `indy`, open **Developer → +Add → Developer Catalog → All Services**. Search **PHP + MySQL (Persistent)**, its display name. Select the item backed by `indy/ex288-php-mysql`, then **Instantiate Template**.

| Field | Value |
| --- | --- |
| Namespace — project dropdown | `indy` |
| Name | `php-app` |
| Greeting Audience | `Architects` |
| Greeting Message | `Namaste` |
| Namespace — builder parameter | `indy` |
| Application Hostname | `php-app-indy.apps-crc.testing` |
| Git Repository URL | `https://gitlab.com/hits.govind/php-greeting-app.git` |
| Git Reference | `main` |
| Context Directory | Leave blank |
| PHP Version | `8.2` |

Click **Create** instead of running `oc new-app`; do not instantiate twice. Check the build under **Builds** and open the application Route from **Topology**.

## Troubleshooting

| Problem | Check / fix |
| --- | --- |
| Template not found or missing from catalog | `oc get template ex288-php-mysql -n indy`. Keep the resource name consistent; search the catalog by its display name. |
| Build fails | `oc logs -f bc/php-app` and `oc describe bc/php-app`. Verify `indy/php:8.2`, source URL, and ref `main`. |
| Route fails or greeting is wrong | `oc logs deployment/php-app`, `oc set env deployment/php-app --list`, and `oc get endpointslices -l kubernetes.io/service-name=php-app`. Check greeting values, ready endpoints, and CRC DNS. |

## Key takeaway

Registering a Template does not deploy its objects. Instantiate it with the correct parameters, then verify build completion, Pod readiness, and the actual HTTP response.
