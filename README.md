# TL;DR;

This Terraform script lets you deploy a Lambda function on CloudFront that will compress your images on demand.
You can use the Lambda function on an existing distribution, or create a separate one to serve your files stored in S3.
To do so, prefix all your images with `https://images.your_domain.com/` to compress them on the fly, for example:

`https://images.your_domain.com/https://a_random_image_from_anywhere?width=200`

... will compress then cache the origin image to a width of 200px and a preserved aspect ratio.

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
![width = 400 (size = 26KB)](https://images.getlionel.com/https://raw.githubusercontent.com/li0nel/terraform-aws-cloudfront-image-compression/master/image.png?width=400)

* width 300px, size 16.7KB
![width = 300 (size = 16.7KB)](https://images.getlionel.com/https://raw.githubusercontent.com/li0nel/terraform-aws-cloudfront-image-compression/master/image.png?width=300)

* width 200px, size 8.4KB
![width = 200 (size = 8.4KB)](https://images.getlionel.com/https://raw.githubusercontent.com/li0nel/terraform-aws-cloudfront-image-compression/master/image.png?width=200)

* width 100px, size 3.1KB
![width = 100 (size = 3.1KB)](https://images.getlionel.com/https://raw.githubusercontent.com/li0nel/terraform-aws-cloudfront-image-compression/master/image.png?width=100)

## Usage

Clone this Terraform files and replace variables in `terraform.tfvars` by your own values.

```bash
cd lambda/code/origin_response

npm install
```

Run `terraform apply` and enjoy

## Authors

Module managed by [Lionel Martin](https://getlionel.com)

## License

Apache 2 Licensed. See LICENSE for full details
