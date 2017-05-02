import React, { Component } from 'react';
import Bitcoin from '../libs/Bitcoin';
import { Api } from '../constants';
import _ from 'lodash';

import RaisedButton from 'material-ui/RaisedButton';
import Paper from 'material-ui/Paper';
import TextField from 'material-ui/TextField';

import {
    Table,
    TableBody,
    TableHeader,
    TableHeaderColumn,
    TableRow,
    TableRowColumn,
} from 'material-ui/Table';

const styles = {
    container: {
        display: 'flex',
        width: '100%',
        // border: '1px solid red',
        alignItems: 'center'
    },
    mainPanel: {
        flex: 10,
        flexDirection: 'column',
        // border: '1px solid blue',
        // backgroundColor: 'grey'
        marginTop: 10,
        marginLeft: 20
    },
    paperPanel: {
        marginBottom: 10
    },
    row: {
        flex: 1,
        display: 'flex',
        // border: '1px groove red',
        // justifyContent: 'flex-end'
        alignItems: 'center',
    },
    textInput: {
        marginLeft: 10,
        width: '100%',
        flex: 1,
        // border: '1px solid blue',
    },
    fieldTitle: {
        width: 100
    },

};

class Sample01 extends Component {
    constructor(props) {
        super(props);

        this.state = {
            hdseed: '',
            address: '',
            private: '',
            balance: 0,
            unconfirmedBalance: 0,
            utxo: [],
            coinPrice: null,
            feeRate: null,
            sendValue: 0,
            sendTo: '',
            sendFee: 0,
            rawTxs: []
        }
    }

    componentDidMount() {
        this.getWalletConfig();
    }

    componentWillUnmount() {

    }

    getBalance(addr) {
        fetch(Api.BTCGetBalance(addr))
            .then((response) => response.json())
            .then((responseJson) => {
                console.log('getBalance', responseJson);
                this.setState({
                    balance: responseJson.balance,
                    unconfirmedBalance: responseJson.unconfirmedBalance
                });
            })
            .catch(error => {
                console.log(error);
            });
    }

    getUnspendOutput(addr) {
        fetch(Api.BTCGetUnspentOutputs(addr))
            .then((response) => response.json())
            .then((responseJson) => {
                console.log('getUnspendOutput', responseJson);
                this.setState({ utxo: responseJson });
            })
            .catch(error => {
                console.log(error);
            });
    }

    getTxs(addr) {
        fetch(Api.BTCGetTxs(addr, 0, 40))
            .then((response) => response.json())
            .then((responseJson) => {
                console.log('getTxs', responseJson);
                this.setState({ rawTxs: responseJson.items });
            })
            .catch(error => {
                console.log(error);
            });
    }

    getWalletConfig() {
        fetch(Api.WALLETCONFIG)
            .then((response) => response.json())
            .then((responseJson) => {
                console.log('getWalletConfig', responseJson);
                this.setState({
                    coinPrice: responseJson.coinPrice,
                    feeRate: responseJson.fee
                });
            })
            .catch(error => {
                console.log(error);
            });
    }

    initWallet() {
        // involve note unlock relief cliff general quiz tourist grid consider miracle early
        //copper siren differ use like egg sight where spoon learn swamp swarm
        //saddle marriage volcano stool organ federal february elbow art extra wood thunder
        // const mnemonic = 'copper siren differ use like egg sight where spoon learn swamp swarm';
        const btc = Bitcoin.createAddressFromMasterSeed(this.state.hdseed);
        console.log('initWallet', btc);
        this.setState({ address: btc.addr, private: btc.privateKey });

        this.getBalance(btc.addr);
        this.getTxs(btc.addr);
        this.getUnspendOutput(btc.addr);
    }

    sendBtc() {
        const estimateFee = Bitcoin.estimateFee(this.state.utxo, this.state.sendValue, this.state.feeRate.btc.medium);
        const rawTx = Bitcoin.createRawTx(this.state.utxo, this.state.sendTo, this.state.sendValue, this.state.private, estimateFee, this.state.feeRate.btc.medium);
        console.log('sendBtc - rawTx', rawTx);

        fetch(Api.BTCSendRawTx(), {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ rawtx: rawTx })
        })
            .then((response) => response.json())
            .then((responseJson) => {
                console.log('sendBtc result:', responseJson);
                return responseJson;
            })
            .catch((error) => {
                console.error(error);
                throw (error);
            });
    }

    handleChangeSendToAddress(event, newValue) {
        this.setState({ sendTo: newValue });
    }

    handleChangeSendValue(event, newValue) {
        this.setState({ sendValue: newValue });
        clearTimeout(this.caculateFee);
        this.caculateFee = setTimeout(() => {
            if (Number(newValue) > 0) {
                const estimateFee = Bitcoin.estimateFee(this.state.utxo, Number(newValue), this.state.feeRate.btc.medium);
                this.setState({ sendFee: estimateFee });
            } else {
                this.setState({ sendFee: 0 });
            }
        }, 1000);
    }

    renderTableTxs() {
        return (
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHeaderColumn>Type</TableHeaderColumn>
                        <TableHeaderColumn>From/To</TableHeaderColumn>
                        <TableHeaderColumn>Value</TableHeaderColumn>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {
                        _.each(this.state.rawTxs, (tx) => {
                            console.log(tx);
                            if (tx.vin[0].addr === this.state.address) {
                                return (
                                    <TableRow>
                                        <TableRowColumn>SEND</TableRowColumn>
                                        <TableRowColumn>{tx.vout[0].scriptPubKey.addresses[0]}</TableRowColumn>
                                        <TableRowColumn>{tx.valueIn}</TableRowColumn>
                                    </TableRow>
                                )
                            } else {
                                return (
                                    <TableRow>
                                        <TableRowColumn>RECEIVE</TableRowColumn>
                                        <TableRowColumn>{tx.vin[0].addr}</TableRowColumn>
                                        <TableRowColumn>{tx.valueOut}</TableRowColumn>
                                    </TableRow>
                                )
                            }
                        })
                    }
                </TableBody>
            </Table>
        );
    }

    render() {
        return (
            <div style={styles.container}>
                <div style={styles.mainPanel}>
                    <Paper style={styles.paperPanel} zDepth={2} rounded={false}>
                        <div style={styles.row}>
                            <TextField
                                hintText="Passphrases"
                                style={styles.textInput}
                                value={this.state.hdseed}
                                onChange={(event, newValue) => { this.setState({ hdseed: newValue }) }}
                                multiLine
                                rowsMax={2}
                            />
                            <RaisedButton
                                label='Init Wallet'
                                style={{ marginLeft: 10, marginRight: 10 }}
                                onTouchTap={() => this.initWallet()}
                            />
                        </div>
                        <div style={styles.row}>
                            <span style={styles.fieldTitle}>
                                Address
                            </span>
                            <TextField
                                hintText="Address"
                                disabled={true}
                                style={styles.textInput}
                                value={this.state.address} />
                        </div>
                        <div style={styles.row}>
                            <span style={styles.fieldTitle}>
                                Balance
                            </span>
                            <TextField
                                disabled={true}
                                hintText="Balance"
                                style={styles.textInput}
                                value={this.state.balance}
                            />
                            <span style={styles.fieldTitle}>
                                Unconfirmed
                            </span>
                            <TextField
                                disabled={true}
                                hintText="Balance"
                                style={styles.textInput}
                                value={this.state.unconfirmedBalance}
                            />
                        </div>
                    </Paper>
                    <Paper style={styles.paperPanel} zDepth={2} rounded={false}>
                        <div style={styles.row}>
                            <div style={styles.fieldTitle}>
                                SendTo
                            </div>
                            <TextField
                                hintText="Btc Address"
                                style={styles.textInput}
                                onChange={this.handleChangeSendToAddress.bind(this)}
                                value={this.state.sendTo}
                            />
                        </div>
                        <div style={styles.row}>
                            <div style={styles.fieldTitle}>
                                Value
                            </div>
                            <TextField
                                hintText="BTC value"
                                style={styles.textInput}
                                onChange={this.handleChangeSendValue.bind(this)}
                                value={this.state.sendValue}
                            />
                            <div style={styles.fieldTitle}>
                                Fee
                            </div>
                            <TextField
                                hintText="BTC value"
                                style={styles.textInput}
                                onChange={(event, newValue) => { this.setState({ sendFee: newValue }) }}
                                value={this.state.sendFee}
                            />
                            <RaisedButton
                                label='SEND'
                                onTouchTap={() => this.sendBtc()}
                                style={{ marginLeft: 10, marginRight: 10 }}
                            />
                        </div>
                    </Paper>
                </div>

                <div style={{ flex: 10, paddingLeft: 10, paddingRight: 20 }}>
                    <Paper style={styles.paperPanel} zDepth={2} rounded={false}>
                        {this.renderTableTxs()}
                    </Paper>
                </div>
            </div>
        );
    }
}

export default Sample01;
