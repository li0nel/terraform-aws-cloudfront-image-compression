# TL;DR;

This Terraform script lets you deploy a Lambda function on CloudFront that will compress your images on demand.
You can use the Lambda function on an existing distribution, or create a separate one to serve your files stored in S3.
To do so, prefix all your images with `https://images.your_domain.com/` to compress them on the fly, for example:

`https://images.your_domain.com/image_in_my_bucket.png?width=200&webp=1`

... will compress then cache the origin image to a 200px-wide WebP image with a preserved aspect ratio.

Great to generate [responsive images tags](https://developer.mozilla.org/en-US/docs/Learn/HTML/Multimedia_and_embedding/Responsive_images) from one single image.

# Image compression "at the edge"

Terraform module which lets you supercharge your website by automatically compressing your images on CloudFront, using Lambda@Edge

Based on https://github.com/lovell/sharp for faster compression than ImageMagick

These types of resources are supported:

* [CloudFront Distribution](https://www.terraform.io/docs/providers/aws/r/cloudfront_distribution.html)
* [Lambda@Edge](https://www.terraform.io/docs/providers/aws/r/lambda_function.html)

## How does it work - What does it solve?

If your website or web application displays user-generated images, you need to resize and compress them to keep your website as fast as possible.
A classic way to handle this is to have a Lambda function triggered on the receiving S3 bucket that would compress them in place, possibly in various sizes.
However it does not work if images are hosted by a third-party partner and when your front-end is changing and you want to offer different sizes later down the road.

This CloudFront-based Lambda function will let you update the image size at any time.

For an original image of 527KB:
* width 400px, size 26KB
![width = 400 (size = 26KB)](https://images.getlionel.com/image.png?width=400)

* width 300px, size 16.7KB
![width = 300 (size = 16.7KB)](https://images.getlionel.com/image.png?width=300)

* width 200px, size 8.4KB
![width = 200 (size = 8.4KB)](https://images.getlionel.com/image.png?width=200)

* width 100px, size 3.1KB
![width = 100 (size = 3.1KB)](https://images.getlionel.com/image.png?width=100)

## Usage

Clone this Terraform files and replace variables in `terraform.tfvars` by your own values.

Edit: You need to replace node_modules/sharp by a version compiled on a compatible operating system, so the build is compatible with Lambda execution environment.
I will document this later, in the mean time, know that you can build it on a `ami-489f8e2c`:

```bash
docker-machine create -d amazonec2 --amazonec2-access-key YOUR_ACCESS_KEY --amazonec2-secret-key YOUR_SECRET_KEY --amazonec2-instance-type t2.small --amazonec2-ami ami-489f8e2c --amazonec2-region eu-west-2 buildmachine
```

```bash
cd lambda/code/origin_response

npm install
```

Run `terraform apply` and enjoy

## Authors

Module managed by [Lionel Martin](https://getlionel.com)

## License

Apache 2 Licensed. See LICENSE for full details
