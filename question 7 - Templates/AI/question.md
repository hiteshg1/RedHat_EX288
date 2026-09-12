# Question 7 — Deploy an application from a template

Preparation is complete before the timer starts. Use project **indy**.

The public PHP source is available at `https://gitlab.com/hits.govind/php-greeting-app.git`, branch `main`. The template file is available at:

`http://fileserver-indy.apps-crc.testing/files/php-app.yaml`

The PHP builder ImageStreamTag `php:8.2` is available in `indy`.

## Requirements

1. Create a Template named `ex288-php-mysql` and label it `template=php-app`.
2. Deploy application `php-app` from this template.
3. Supply the values needed to build and deploy the application.
4. Set its greeting to **Namaste Architects!**.
5. Set its Route hostname to `php-app-indy.apps-crc.testing`.
6. Confirm the build completes, both application replicas are running and ready, and HTTP access displays the required greeting.

The source application is already prepared. You may modify the downloaded template as needed.
