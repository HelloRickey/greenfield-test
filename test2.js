require("dotenv").config();
var mimeTypes = require("mime-types");
const fs = require("node:fs");
const path = require("node:path");
const {
    Client,
    Long,
    VisibilityType,
    RedundancyType,
    bytesFromBase64,
  } = require("@bnb-chain/greenfield-js-sdk");
const GRPC_URL = "https://gnfd-testnet-fullnode-tendermint-ap.bnbchain.org";
const GREEN_CHAIN_ID = "5600";
const client = Client.create(GRPC_URL, GREEN_CHAIN_ID);
const file = createFile('./hello0503.json');

function createFile(filePath) {
    const stats = fs.statSync(filePath);
    const fileSize = stats.size;
  
    const extname = path.extname(filePath);
    const type = mimeTypes.lookup(extname);
  
    if (!type) throw new Error(`Unsupported file type: ${filePath}`);
  
    return {
      name: filePath,
      type,
      size: fileSize,
      content: fs.readFileSync(filePath),
    };
  }


async function test(){
    const res = await client.object.delegateUploadObject(
        {
          bucketName: 'testbucket0501',
          objectName: 'hello0503',
          body: file,
          delegatedOpts: {
            visibility: VisibilityType.VISIBILITY_TYPE_PUBLIC_READ,
          },
        },
        {
          type: 'ECDSA',
          privateKey: process.env.ACCOUNT_PRIVATEKEY,
        },
    );
    console.log("res",res)
}

test()