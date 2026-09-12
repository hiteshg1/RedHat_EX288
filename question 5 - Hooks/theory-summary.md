# Question 5 — Essential theory

## What the hook does

A post-commit hook runs inside a temporary container using the newly assembled image. It runs before registry publication, not after the build is marked complete. A nonzero hook exit fails the build; changes to files in that temporary container do not become part of the final image.

This makes the hook useful for checking an image before publishing it. Here, it executes the existing notification script without changing source. See the [official sources in README.md](README.md#sources).

## Resources and execution order

- **BuildConfig:** stores the reusable source, builder, output, and hook settings.
- **Build:** records one attempt and its result.
- **ImageStream:** tracks the resulting application image.
- **Deployment:** runs the application; its image trigger consumes image updates.
- **Service and Route:** expose the application to requests.

The relevant order is: assemble the image → run the hook → publish the image → complete the build. A Deployment update and application availability are separate checks.

## Distinctions to remember

- A build trigger starts a build. A build hook runs during it. A Deployment image trigger updates the running application when the image changes.
- Configuring the BuildConfig affects new builds; it does not alter a build already in progress.
- `python3 mailer.py` needs Python on the image's path and a readable script in the working directory. The script's executable bit is not required.
- The supplied mailer prints optimistic status text and tolerates mail errors. Its final message proves execution reached that line, not that a recipient received mail.
- A healthy application may still be serving its previous image. Check Build status separately.

## Exam reminders

Use build logs to prove execution, final Build status to prove success, and the Route to prove availability. Keep changes in the BuildConfig when the question prohibits source modifications.
