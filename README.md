# Image compression "at the edge"

Terraform module which lets you supercharge your website by automatically compress your images on CloudFront, using Lambda@Edge

These types of resources are supported:

* [CloudFront Distribution](https://www.terraform.io/docs/providers/aws/r/cloudfront_distribution.html)
* [Lambda@Edge](https://www.terraform.io/docs/providers/aws/r/lambda_function.html)

## How does it work




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
