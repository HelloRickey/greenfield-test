require("dotenv").config();
var mime = require("mime-types");
const fs = require("node:fs");
const {
  Client,
  Long,
  VisibilityType,
  RedundancyType,
  bytesFromBase64,
} = require("@bnb-chain/greenfield-js-sdk");
const {
  NodeAdapterReedSolomon,
} = require("@bnb-chain/reed-solomon/node.adapter");
const GRPC_URL = "https://gnfd-testnet-fullnode-tendermint-ap.bnbchain.org";
const GREEN_CHAIN_ID = "5600";
const client = Client.create(GRPC_URL, GREEN_CHAIN_ID);
const { ReedSolomon } = require("@bnb-chain/reed-solomon");

test2();

async function test() {
  const fileName =
    new Date().getTime() +
    Math.floor(Math.random() * 10000000).toString() +
    ".json";
  const filePath = "./test0502.json";
  const fileBuffer = fs.readFileSync(filePath);

  const rs = new NodeAdapterReedSolomon();

  const expectCheckSums = await rs.encodeInWorker(
    __filename,
    Uint8Array.from(fileBuffer)
  );
  const fileType = mime.lookup(filePath);

  const createObjectTx = await client.object.createObject({
    bucketName: "testbucket0501",
    objectName: fileName,
    creator: process.env.ACCOUNT_ADDRESS,
    visibility: VisibilityType.VISIBILITY_TYPE_PUBLIC_READ,
    contentType: fileType,
    redundancyType: RedundancyType.REDUNDANCY_EC_TYPE,
    payloadSize: Long.fromInt(fileBuffer.length),
    expectChecksums: expectCheckSums.map((x) => bytesFromBase64(x)),
  });

  const simulateInfo = await createObjectTx.simulate({
    denom: "BNB",
  });

  const createObjectTxRes = await createObjectTx.broadcast({
    denom: "BNB",
    gasLimit: Number(simulateInfo?.gasLimit),
    gasPrice: simulateInfo?.gasPrice || "5000000000",
    payer: process.env.ACCOUNT_ADDRESS,
    granter: "",
    privateKey: process.env.ACCOUNT_PRIVATEKEY,
  });

  console.log("createObjectTxRes", createObjectTxRes);

  var result = await client.object.uploadObject(
    {
      bucketName: "testbucket0501",
      objectName: fileName,
      body: createFile(filePath),
      txnHash: createObjectTxRes.transactionHash,
    },
    {
      type: "ECDSA",
      privateKey: process.env.ACCOUNT_PRIVATEKEY,
    }
  );

  console.log("result", result);
}

function createFile(path) {
  const stats = fs.statSync(path);
  const fileSize = stats.size;

  return {
    name: path,
    type: "",
    size: fileSize,
    content: fs.readFileSync(path),
  };
}


// result {
//   code: '110004',
//   message: 'invalid payload data integrity hash',
//   statusCode: 406
// }
async function test2() {
  const jsonStr =
    '{ "name": "John Doe", "age": 30, "email": "johndoe@example.com" }';
  const uint8Array = new TextEncoder().encode(jsonStr);
  const fileBuffer = Uint8Array.from(uint8Array);

  console.log("fileBuffer", fileBuffer);

  const fileName =
    new Date().getTime() +
    Math.floor(Math.random() * 10000000).toString() +
    ".json";
  const fileType = "application/json";
  const fileSize = fileBuffer.byteLength;
  console.log("fileSize",fileSize)

  // const rs = new ReedSolomon();
  // const expectCheckSums = await rs.encode(Uint8Array.from(fileBuffer));

  // const createObjectTx = await client.object.createObject({
  //   bucketName: "testbucket0501",
  //   objectName: fileName,
  //   creator: process.env.ACCOUNT_ADDRESS,
  //   visibility: VisibilityType.VISIBILITY_TYPE_PUBLIC_READ,
  //   contentType: fileType,
  //   redundancyType: RedundancyType.REDUNDANCY_EC_TYPE,
  //   payloadSize: Long.fromInt(fileBuffer.length),
  //   expectChecksums: expectCheckSums.map((x) => bytesFromBase64(x)),
  // });

  // const simulateInfo = await createObjectTx.simulate({
  //   denom: "BNB",
  // });

  // const createObjectTxRes = await createObjectTx.broadcast({
  //   denom: "BNB",
  //   gasLimit: Number(simulateInfo?.gasLimit),
  //   gasPrice: simulateInfo?.gasPrice || "5000000000",
  //   payer: process.env.ACCOUNT_ADDRESS,
  //   granter: "",
  //   privateKey: process.env.ACCOUNT_PRIVATEKEY,
  // });


  var result = await client.object.delegateUploadObject(
    {
      bucketName: "testbucket0501",
      objectName: fileName,
      body: {
        name: fileName,
        type: fileType,
        size: fileSize,
        content: fileBuffer,
      },
      delegatedOpts: {
        visibility: VisibilityType.VISIBILITY_TYPE_PUBLIC_READ,
      },
    },
    {
      type: "ECDSA",
      privateKey: process.env.ACCOUNT_PRIVATEKEY,
    }
  );

  console.log("result", result);
}
