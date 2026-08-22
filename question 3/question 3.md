# Question: Build and Deploy an S2I Application Across Projects

You have a Git repository named `oxy` containing an `index.html` file and a custom Source-to-Image script at `.s2i/bin/assemble`.

## Deploy the application so that:

1. The application image is built in the `s2i-builds` project using the OpenShift-provided HTTPD S2I builder image.
2. The custom `assemble` script runs during the build. It must copy HTML files from `/tmp/src` into the builder's application directory and create an `info.html` file containing:
   - the build date in `YYYY-mm-dd` format; and
   - `Your info.html is working if you see this.`
3. The built image is stored as the `oxy:latest` ImageStream tag in `s2i-builds`.
4. The application is deployed in the separate `tocin` project by consuming that ImageStream.
5. The `tocin` project is granted permission to pull the image from `s2i-builds`.
6. The application is exposed through a Route and both the main page and `/info.html` respond successfully.

The main page must display:

`This is the application oxy. If you see this its working.`

Use the cluster's generated Route hostname. In CRC, this normally ends in `apps-crc.testing`.
