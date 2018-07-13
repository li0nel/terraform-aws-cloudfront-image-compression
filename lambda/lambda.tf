variable "stack_name" {
  type = "string"
}

variable "aws_profile" {
  type = "string"
}

variable "s3_bucket_endpoint" {
  type = "string"
}

provider "aws" {
  region  = "us-east-1"
  profile = "${var.aws_profile}"
  alias   = "us-east-1"
  version = "~> 1.9"
}

resource "aws_iam_role" "iam_for_lambda" {
  name = "iam_for_lambda_at_edge-${var.stack_name}"

  assume_role_policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": "sts:AssumeRole",
      "Principal": {
        "Service": [
          "lambda.amazonaws.com",
          "edgelambda.amazonaws.com"
        ]
      },
      "Effect": "Allow"
    }
  ]
}
EOF
}

resource "aws_iam_role_policy" "lambda_role_policy" {
  name = "lambda-policy-at-edge-${var.stack_name}"
  role = "${aws_iam_role.iam_for_lambda.id}"

  policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
      {
         "Effect": "Allow",
         "Action": [
            "logs:CreateLogGroup",
            "logs:CreateLogStream",
            "logs:PutLogEvents"
         ],
         "Resource": [
            "*"
         ]
      }
  ]
}
EOF
}

data "template_file" "indexjs" {
  template = "${file("${path.module}/code/origin_response/index.tpl.js")}"

  vars {
    s3_website_endpoint = "${var.s3_bucket_endpoint}"
  }
}

resource "local_file" "indexjs" {
  content     = "${data.template_file.indexjs.rendered}"
  filename = "${path.module}/code/origin_response/index.js"
}

// origin response
data "archive_file" "lambda_origin_response" {
  type        = "zip"
  source_dir  = "${path.module}/code/origin_response"
  output_path = "${path.module}/origin_response.zip"
}

resource "aws_lambda_function" "origin_response" {
  filename         = "${data.archive_file.lambda_origin_response.output_path}"
  function_name    = "origin_response-${var.stack_name}"
  role             = "${aws_iam_role.iam_for_lambda.arn}"
  handler          = "index.handler"
  runtime          = "nodejs6.10"
  source_code_hash = "${base64sha256(file("${data.archive_file.lambda_origin_response.output_path}"))}"
  publish          = true
  timeout          = 15
  provider         = "aws.us-east-1"
}