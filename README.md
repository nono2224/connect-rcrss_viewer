# connect-rcrss_viewer

[RoboCupRescue Simulation Server](https://github.com/roborescue/rcrs-server)のシミュレーションにおいて，可視化システムで使用するデータをリアルタイムで受信するコードです

## くわしく

RoboCupRescue Simulation Server においてシミュレーションを実行する際に，リアルタイムでシミュレーション状況を可視化するシステムを接続することができます．

本プログラムは RoboCupRescue Simulation Server に接続し，リアルタイムでシミュレーションのデータを取得するものです．

## セットアップ

### 1. クローン

GitHub より本リポジトリをクローンします

```sh
git clone https://github.com/nono2224/connect-rcrss_viewer.git
```

### 2. リポジトリへ移動

本リポジトリへ移動を行います

```sh
cd connect-rcrss_viewer
```

### 3. パッケージのダウンロード

本システムで使用される必要なパッケージのダウンロードを行います

```sh
npm install
```

## つかいかた

### 1. RoboCupRescue Simulation Server の実行

RoboCupRescue Simulation Server の実行を行います

```sh
cd rcrs-server/scripts
bash start-comprun.sh
```

-   オプション

    -   `-m <MAPDIR>` または`--map <MAPDIR>` より，実行するマップの指定
        -   規定値は`../maps/test/map`
    -   `-c <CONFIGDIR>` または`--config <CONFIGDIR>` より，マップに関連つけられた構成（シナリオ）の指定
        - 規定値は`../maps/test/config`
    -   `-l <LOGDIR>` または`--log <LOGDIR>` より，ログの出力場所の指定

        -   規定値は`../logs`

    -   例 1.

    ```sh
    cd rcrs-server/scripts
    bash start-comprun.sh -m ../maps/vc/map -c ../maps/vc/config
    ```

    -   例 2.

    ```sh
    cd rcrs-server/scripts
    bash start-comprun.sh -m ../maps/vc/map -c ../maps/vc/config -l log2
    ```

詳しくは[RoboCupRescue Simulation Server](https://github.com/roborescue/rcrs-server)より

### 2. 本システムの実行

本システムの実行をします

```sh
npm start
```

### 3. エージェントプログラムの実行

エージェントプログラムの実行をします

```sh
cd < agentProgram >
bash launch.sh -all
```

### おわり

`out`ディレクトリ内に，通信による受信の順番にナンバリングされて json 形式で出力されます
