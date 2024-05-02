const express = require("express");
require("dotenv").config();
var bodyParser = require("body-parser");
const {
  Client,
  Long,
  VisibilityType,
  RedundancyType,
  bytesFromBase64,
} = require("@bnb-chain/greenfield-js-sdk");
const { ReedSolomon } = require("@bnb-chain/reed-solomon");

var multer = require("multer");
var upload = multer();

const app = express();
const port = 3011;

var mime = require("mime-types");

const GRPC_URL = "https://gnfd-testnet-fullnode-tendermint-ap.bnbchain.org";
const GREEN_CHAIN_ID = "5600";
const client = Client.create(GRPC_URL, GREEN_CHAIN_ID);

app.use(bodyParser.urlencoded({ extended: true }));
app.post("/files", upload.single("file"), async function (req, res, next) {
  const fileName = req.file.originalname;
  const fileType = req.file.mimetype;
  const fileBuffer = req.file.buffer;
  const fileSize = req.file.size;

  console.log("fileBuffer", fileBuffer);

  const rs = new ReedSolomon();
  const expectCheckSums = await rs.encode(Uint8Array.from(fileBuffer));

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

  try {
    const createObjectTxRes = await createObjectTx.broadcast({
      denom: "BNB",
      gasLimit: Number(simulateInfo?.gasLimit),
      gasPrice: simulateInfo?.gasPrice || "5000000000",
      payer: process.env.ACCOUNT_ADDRESS,
      granter: "",
      privateKey: process.env.ACCOUNT_PRIVATEKEY,
    });

    var result = await client.object.uploadObject(
      {
        bucketName: "testbucket0501",
        objectName: fileName,
        body: {
          name: fileName,
          type: fileType,
          size: fileSize,
          content: fileBuffer,
        },
        txnHash: createObjectTxRes.transactionHash,
      },
      {
        type: "ECDSA",
        privateKey: process.env.ACCOUNT_PRIVATEKEY,
      }
    );

    console.log("result", result);
  } catch (error) {
    res.send("error");
  }

  res.send("hello");
});

app.post("/json", async (req, res) => {
  //   var jsonStr= req.body.data;

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

  const rs = new ReedSolomon();
  const expectCheckSums = await rs.encode(Uint8Array.from(fileBuffer));

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

  console.log("fileBuffer", fileBuffer);

  var result = await client.object.uploadObject(
    {
      bucketName: "testbucket0501",
      objectName: fileName,
      body: {
        name: fileName,
        type: fileType,
        size: fileSize,
        content: fileBuffer,
      },
      txnHash: createObjectTxRes.transactionHash,
    },
    {
      type: "ECDSA",
      privateKey: process.env.ACCOUNT_PRIVATEKEY,
    }
  );

  console.log("result", result);

  //   res.send("hello");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
