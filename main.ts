import { Construct } from 'constructs'
import {
  App,
  AssetType,
  TerraformAsset,
  TerraformStack,
} from 'cdktf'
import { GoogleProvider } from '@cdktf/provider-google/lib/provider'
import {
  storageBucket as sb,
  storageBucketObject as sbo,
  cloudfunctions2Function as cf2,
} from '@cdktf/provider-google'
import * as path from 'path'
import { execSync } from 'child_process'

class MyStack extends TerraformStack {
  constructor(scope: Construct, name: string) {
    super(scope, name)

    const provider = new GoogleProvider(this, 'GoogleProvider', {
      project: 'bfw-devops',
      region: 'us-east1',
    })
    const bucket = new sb.StorageBucket(this, 'Bucket', {
      name: 'bfw-sandbox',
      provider,
      location: provider.region!,
    })
    execSync('npm i && npx tsc', { cwd: path.resolve(__dirname, './src') })
    const asset = new TerraformAsset(this, 'CloudFunctionsAsset', {
      path: path.resolve(__dirname, './src'),
      type: AssetType.ARCHIVE,
    })
    const object = new sbo.StorageBucketObject(this, 'BucketObject', {
      bucket: bucket.name,
      name: asset.fileName,
      source: asset.path,
    })
    /**
     * @see https://cloud.google.com/functions/docs/writing?hl=ja
     */
    new cf2.Cloudfunctions2Function(this, 'HelloWorldFunction', {
      provider,
      name: 'HelloWorldFunction',
      serviceConfig: {
        availableMemory: '256M',
      },
      location: provider.region,
      buildConfig: {
        runtime: 'nodejs18',
        source: {
          storageSource: {
            bucket: object.bucket,
            object: object.name,
          }
        },
      }
    })
  }
}

const app = new App()
new MyStack(app, 'learn-cdktf-docker')
app.synth()
execSync('npx tsc --build --clean')
