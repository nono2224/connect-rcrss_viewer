const net = require('net');
const proto = require("./RCRSProto_pb");

// メッセージをシミュレーションサーバに送信
const client = net.connect('27931', 'localhost', () => {
    const message = new proto.MessageProto();
    // VKConnect: ビューワからの接続要求に使用するメッセージ
    message.setUrn(0x0100 | 13);

    const map = message.getComponentsMap();
    const requestId = new proto.MessageComponentProto();
    const version = new proto.MessageComponentProto();
    const name = new proto.MessageComponentProto();
    // requestIdはユニークな値にする必要あり
    requestId.setIntvalue(2);
    // versionはサーバ側で使用されている気配はないので適当な値で良い
    version.setIntvalue(1);
    // nameはViewerの名前を設定
    name.setStringvalue('ringo');

    map.set(0x0200 | 1, requestId);
    map.set(0x0200 | 3, version);
    map.set(0x0200 | 4, name);

    send(message);
});

// シミュレーションサーバからのメッセージを受信
client.on('data', data => {
    // メッセージのサイズを取得
    const size = data[0] << 24 | data[1] << 16 | data[2] << 8 | data[3];
    let res;
    try {
        // メッセージをデシリアライズ（たまにエラーが出るので要検証）
        res = proto.MessageProto.deserializeBinary(data.subarray(4, size + 4));
    } catch (error) {
        console.error(error);
        return;
    }

    // メッセージをJSON形式で出力
    // シミュレーション中は毎ステップごとにKVTimestepが送られてくる．中身についてはrcrs-serverのrescuecore2.messages.control.KVTimestepを参照．
    console.log(JSON.stringify(res.toObject()));

    // 帰ってきたメッセージのURNがKVConnectOKのとき
    if (res.getUrn() == (0x0100 | 15)) {
        const message = new proto.MessageProto();
        // KVAcknowledge: サーバからの接続許可を受け取ったことをサーバに通知するメッセージ
        message.setUrn(0x0100 | 14);

        const map = message.getComponentsMap();
        const requestId = new proto.MessageComponentProto();
        const viewerId = new proto.MessageComponentProto();
        // requestIdとviewerIdはKVConnectOKのメッセージから取得できる
        requestId.setIntvalue(res.getComponentsMap().get(0x0200 | 1).getIntvalue());
        viewerId.setIntvalue(res.getComponentsMap().get(0x0200 | 12).getIntvalue());

        map.set(0x0200 | 1, requestId);
        map.set(0x0200 | 12, viewerId);

        send(message);
    }
    // client.destroy();
});

function send(message) {
    const buffer = message.serializeBinary();
    client.write(new Uint8Array([
        (buffer.length >> 24) & 255,
        (buffer.length >> 16) & 255,
        (buffer.length >> 8) & 255,
        buffer.length & 255,
    ]));
    client.write(buffer);
}