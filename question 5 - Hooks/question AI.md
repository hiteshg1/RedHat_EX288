# Question 5 — Customize the build process

## Scenario

Preparation is complete before the timer starts.

A Python 3 application named **blog** is running in project **octane**. Its source is `https://gitlab.com/hits.govind/blog.git`, branch `main`. The application image includes `mailer.py` in its application directory.

The application uses BuildConfig `blog`, ImageStream `blog`, Deployment `blog`, Service `blog`, and Route `blog`. Its HTTP address is `http://blog-octane.apps-crc.testing`.

## Requirements

1. Keep the application running and accessible at its Route.
2. Configure the build process to execute the existing `mailer.py` automatically after image assembly, before image publication.
3. Ensure the most recent build completes successfully and its logs show that the script ran.
4. Make this behaviour persist for future builds of the application that reach that stage.
5. Do not modify the application's Git repository during the exercise.

Email delivery is not required. No additional mail infrastructure is needed.
