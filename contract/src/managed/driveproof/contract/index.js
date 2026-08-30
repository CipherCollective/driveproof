import * as __compactRuntime from '@midnight-ntwrk/compact-runtime';
__compactRuntime.checkRuntimeVersion('0.16.0');

const _descriptor_0 = new __compactRuntime.CompactTypeUnsignedInteger(65535n, 2);

const _descriptor_1 = __compactRuntime.CompactTypeJubjubPoint;

const _descriptor_2 = __compactRuntime.CompactTypeBoolean;

const _descriptor_3 = new __compactRuntime.CompactTypeUnsignedInteger(255n, 1);

const _descriptor_4 = __compactRuntime.CompactTypeField;

const _descriptor_5 = new __compactRuntime.CompactTypeUnsignedInteger(4294967295n, 4);

const _descriptor_6 = new __compactRuntime.CompactTypeVector(1, _descriptor_4);

const _descriptor_7 = new __compactRuntime.CompactTypeVector(16, _descriptor_3);

const _descriptor_8 = new __compactRuntime.CompactTypeVector(16, _descriptor_0);

const _descriptor_9 = new __compactRuntime.CompactTypeBytes(32);

class _TripReading_0 {
  alignment() {
    return _descriptor_4.alignment().concat(_descriptor_4.alignment().concat(_descriptor_8.alignment().concat(_descriptor_8.alignment().concat(_descriptor_8.alignment().concat(_descriptor_7.alignment().concat(_descriptor_7.alignment()))))));
  }
  fromValue(value_0) {
    return {
      attestationId: _descriptor_4.fromValue(value_0),
      salt: _descriptor_4.fromValue(value_0),
      gridX: _descriptor_8.fromValue(value_0),
      gridY: _descriptor_8.fromValue(value_0),
      speed: _descriptor_8.fromValue(value_0),
      braking: _descriptor_7.fromValue(value_0),
      timeBucket: _descriptor_7.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_4.toValue(value_0.attestationId).concat(_descriptor_4.toValue(value_0.salt).concat(_descriptor_8.toValue(value_0.gridX).concat(_descriptor_8.toValue(value_0.gridY).concat(_descriptor_8.toValue(value_0.speed).concat(_descriptor_7.toValue(value_0.braking).concat(_descriptor_7.toValue(value_0.timeBucket)))))));
  }
}

const _descriptor_10 = new _TripReading_0();

class _SchnorrSignature_0 {
  alignment() {
    return _descriptor_1.alignment().concat(_descriptor_4.alignment());
  }
  fromValue(value_0) {
    return {
      announcement: _descriptor_1.fromValue(value_0),
      response: _descriptor_4.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_1.toValue(value_0.announcement).concat(_descriptor_4.toValue(value_0.response));
  }
}

const _descriptor_11 = new _SchnorrSignature_0();

class _tuple_0 {
  alignment() {
    return _descriptor_10.alignment().concat(_descriptor_11.alignment().concat(_descriptor_0.alignment()));
  }
  fromValue(value_0) {
    return [
      _descriptor_10.fromValue(value_0),
      _descriptor_11.fromValue(value_0),
      _descriptor_0.fromValue(value_0)
    ]
  }
  toValue(value_0) {
    return _descriptor_10.toValue(value_0[0]).concat(_descriptor_11.toValue(value_0[1]).concat(_descriptor_0.toValue(value_0[2])));
  }
}

const _descriptor_12 = new _tuple_0();

const _descriptor_13 = new __compactRuntime.CompactTypeUnsignedInteger(127n, 1);

const _descriptor_14 = new __compactRuntime.CompactTypeUnsignedInteger(452312848583266388373324160190187140051835877600158453279131187530910662655n, 31);

class _tuple_1 {
  alignment() {
    return _descriptor_13.alignment().concat(_descriptor_14.alignment());
  }
  fromValue(value_0) {
    return [
      _descriptor_13.fromValue(value_0),
      _descriptor_14.fromValue(value_0)
    ]
  }
  toValue(value_0) {
    return _descriptor_13.toValue(value_0[0]).concat(_descriptor_14.toValue(value_0[1]));
  }
}

const _descriptor_15 = new _tuple_1();

class _SchnorrHashInput_0 {
  alignment() {
    return _descriptor_4.alignment().concat(_descriptor_4.alignment().concat(_descriptor_4.alignment().concat(_descriptor_4.alignment().concat(_descriptor_6.alignment()))));
  }
  fromValue(value_0) {
    return {
      ann_x: _descriptor_4.fromValue(value_0),
      ann_y: _descriptor_4.fromValue(value_0),
      pk_x: _descriptor_4.fromValue(value_0),
      pk_y: _descriptor_4.fromValue(value_0),
      msg: _descriptor_6.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_4.toValue(value_0.ann_x).concat(_descriptor_4.toValue(value_0.ann_y).concat(_descriptor_4.toValue(value_0.pk_x).concat(_descriptor_4.toValue(value_0.pk_y).concat(_descriptor_6.toValue(value_0.msg)))));
  }
}

const _descriptor_16 = new _SchnorrHashInput_0();

const _descriptor_17 = new __compactRuntime.CompactTypeBytes(21);

class _tuple_2 {
  alignment() {
    return _descriptor_17.alignment().concat(_descriptor_9.alignment());
  }
  fromValue(value_0) {
    return [
      _descriptor_17.fromValue(value_0),
      _descriptor_9.fromValue(value_0)
    ]
  }
  toValue(value_0) {
    return _descriptor_17.toValue(value_0[0]).concat(_descriptor_9.toValue(value_0[1]));
  }
}

const _descriptor_18 = new _tuple_2();

class _TripSampleHash_0 {
  alignment() {
    return _descriptor_4.alignment().concat(_descriptor_0.alignment().concat(_descriptor_0.alignment().concat(_descriptor_0.alignment().concat(_descriptor_3.alignment().concat(_descriptor_3.alignment())))));
  }
  fromValue(value_0) {
    return {
      prev: _descriptor_4.fromValue(value_0),
      gridX: _descriptor_0.fromValue(value_0),
      gridY: _descriptor_0.fromValue(value_0),
      speed: _descriptor_0.fromValue(value_0),
      braking: _descriptor_3.fromValue(value_0),
      timeBucket: _descriptor_3.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_4.toValue(value_0.prev).concat(_descriptor_0.toValue(value_0.gridX).concat(_descriptor_0.toValue(value_0.gridY).concat(_descriptor_0.toValue(value_0.speed).concat(_descriptor_3.toValue(value_0.braking).concat(_descriptor_3.toValue(value_0.timeBucket))))));
  }
}

const _descriptor_19 = new _TripSampleHash_0();

const _descriptor_20 = new __compactRuntime.CompactTypeBytes(25);

class _tuple_3 {
  alignment() {
    return _descriptor_20.alignment().concat(_descriptor_4.alignment().concat(_descriptor_4.alignment().concat(_descriptor_4.alignment())));
  }
  fromValue(value_0) {
    return [
      _descriptor_20.fromValue(value_0),
      _descriptor_4.fromValue(value_0),
      _descriptor_4.fromValue(value_0),
      _descriptor_4.fromValue(value_0)
    ]
  }
  toValue(value_0) {
    return _descriptor_20.toValue(value_0[0]).concat(_descriptor_4.toValue(value_0[1]).concat(_descriptor_4.toValue(value_0[2]).concat(_descriptor_4.toValue(value_0[3]))));
  }
}

const _descriptor_21 = new _tuple_3();

const _descriptor_22 = new __compactRuntime.CompactTypeBytes(23);

class _tuple_4 {
  alignment() {
    return _descriptor_22.alignment().concat(_descriptor_4.alignment());
  }
  fromValue(value_0) {
    return [
      _descriptor_22.fromValue(value_0),
      _descriptor_4.fromValue(value_0)
    ]
  }
  toValue(value_0) {
    return _descriptor_22.toValue(value_0[0]).concat(_descriptor_4.toValue(value_0[1]));
  }
}

const _descriptor_23 = new _tuple_4();

const _descriptor_24 = new __compactRuntime.CompactTypeUnsignedInteger(18446744073709551615n, 8);

class _Either_0 {
  alignment() {
    return _descriptor_2.alignment().concat(_descriptor_9.alignment().concat(_descriptor_9.alignment()));
  }
  fromValue(value_0) {
    return {
      is_left: _descriptor_2.fromValue(value_0),
      left: _descriptor_9.fromValue(value_0),
      right: _descriptor_9.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_2.toValue(value_0.is_left).concat(_descriptor_9.toValue(value_0.left).concat(_descriptor_9.toValue(value_0.right)));
  }
}

const _descriptor_25 = new _Either_0();

const _descriptor_26 = new __compactRuntime.CompactTypeUnsignedInteger(340282366920938463463374607431768211455n, 16);

class _ContractAddress_0 {
  alignment() {
    return _descriptor_9.alignment();
  }
  fromValue(value_0) {
    return {
      bytes: _descriptor_9.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_9.toValue(value_0.bytes);
  }
}

const _descriptor_27 = new _ContractAddress_0();

export class Contract {
  witnesses;
  constructor(...args_0) {
    if (args_0.length !== 1) {
      throw new __compactRuntime.CompactError(`Contract constructor: expected 1 argument, received ${args_0.length}`);
    }
    const witnesses_0 = args_0[0];
    if (typeof(witnesses_0) !== 'object') {
      throw new __compactRuntime.CompactError('first (witnesses) argument to Contract constructor is not an object');
    }
    if (typeof(witnesses_0.getSchnorrReduction) !== 'function') {
      throw new __compactRuntime.CompactError('first (witnesses) argument to Contract constructor does not contain a function-valued field named getSchnorrReduction');
    }
    if (typeof(witnesses_0.getAttestedTripWitness) !== 'function') {
      throw new __compactRuntime.CompactError('first (witnesses) argument to Contract constructor does not contain a function-valued field named getAttestedTripWitness');
    }
    if (typeof(witnesses_0.getDriverSecret) !== 'function') {
      throw new __compactRuntime.CompactError('first (witnesses) argument to Contract constructor does not contain a function-valued field named getDriverSecret');
    }
    this.witnesses = witnesses_0;
    this.circuits = {
      deriveDriverBinding(context, ...args_1) {
        return { result: pureCircuits.deriveDriverBinding(...args_1), context };
      },
      deriveNullifier(context, ...args_1) {
        return { result: pureCircuits.deriveNullifier(...args_1), context };
      },
      foldTripSample(context, ...args_1) {
        return { result: pureCircuits.foldTripSample(...args_1), context };
      },
      deriveTripCommitment(context, ...args_1) {
        return { result: pureCircuits.deriveTripCommitment(...args_1), context };
      },
      harshBrakingFlag(context, ...args_1) {
        return { result: pureCircuits.harshBrakingFlag(...args_1), context };
      },
      countHarshBraking(context, ...args_1) {
        return { result: pureCircuits.countHarshBraking(...args_1), context };
      },
      proveCompliance: (...args_1) => {
        if (args_1.length !== 1) {
          throw new __compactRuntime.CompactError(`proveCompliance: expected 1 argument (as invoked from Typescript), received ${args_1.length}`);
        }
        const contextOrig_0 = args_1[0];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.currentQueryContext != undefined)) {
          __compactRuntime.typeError('proveCompliance',
                                     'argument 1 (as invoked from Typescript)',
                                     'driveproof.compact line 137 char 1',
                                     'CircuitContext',
                                     contextOrig_0)
        }
        const context = { ...contextOrig_0, gasCost: __compactRuntime.emptyRunningCost() };
        const partialProofData = {
          input: { value: [], alignment: [] },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = this._proveCompliance_0(context, partialProofData);
        partialProofData.output = { value: [], alignment: [] };
        return { result: result_0, context: context, proofData: partialProofData, gasCost: context.gasCost };
      },
      schnorrChallenge(context, ...args_1) {
        return { result: pureCircuits.schnorrChallenge(...args_1), context };
      }
    };
    this.impureCircuits = { proveCompliance: this.circuits.proveCompliance };
    this.provableCircuits = { proveCompliance: this.circuits.proveCompliance };
  }
  initialState(...args_0) {
    if (args_0.length !== 5) {
      throw new __compactRuntime.CompactError(`Contract state constructor: expected 5 arguments (as invoked from Typescript), received ${args_0.length}`);
    }
    const constructorContext_0 = args_0[0];
    const limit_0 = args_0[1];
    const brakeLimit_0 = args_0[2];
    const attestorId_0 = args_0[3];
    const attestorPk_0 = args_0[4];
    if (typeof(constructorContext_0) !== 'object') {
      throw new __compactRuntime.CompactError(`Contract state constructor: expected 'constructorContext' in argument 1 (as invoked from Typescript) to be an object`);
    }
    if (!('initialPrivateState' in constructorContext_0)) {
      throw new __compactRuntime.CompactError(`Contract state constructor: expected 'initialPrivateState' in argument 1 (as invoked from Typescript)`);
    }
    if (!('initialZswapLocalState' in constructorContext_0)) {
      throw new __compactRuntime.CompactError(`Contract state constructor: expected 'initialZswapLocalState' in argument 1 (as invoked from Typescript)`);
    }
    if (typeof(constructorContext_0.initialZswapLocalState) !== 'object') {
      throw new __compactRuntime.CompactError(`Contract state constructor: expected 'initialZswapLocalState' in argument 1 (as invoked from Typescript) to be an object`);
    }
    if (!(typeof(limit_0) === 'bigint' && limit_0 >= 0n && limit_0 <= 65535n)) {
      __compactRuntime.typeError('Contract state constructor',
                                 'argument 1 (argument 2 as invoked from Typescript)',
                                 'driveproof.compact line 41 char 1',
                                 'Uint<0..65536>',
                                 limit_0)
    }
    if (!(typeof(brakeLimit_0) === 'bigint' && brakeLimit_0 >= 0n && brakeLimit_0 <= 255n)) {
      __compactRuntime.typeError('Contract state constructor',
                                 'argument 2 (argument 3 as invoked from Typescript)',
                                 'driveproof.compact line 41 char 1',
                                 'Uint<0..256>',
                                 brakeLimit_0)
    }
    if (!(typeof(attestorId_0) === 'bigint' && attestorId_0 >= 0n && attestorId_0 <= 65535n)) {
      __compactRuntime.typeError('Contract state constructor',
                                 'argument 3 (argument 4 as invoked from Typescript)',
                                 'driveproof.compact line 41 char 1',
                                 'Uint<0..65536>',
                                 attestorId_0)
    }
    const state_0 = new __compactRuntime.ContractState();
    let stateValue_0 = __compactRuntime.StateValue.newArray();
    stateValue_0 = stateValue_0.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_0 = stateValue_0.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_0 = stateValue_0.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_0 = stateValue_0.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_0 = stateValue_0.arrayPush(__compactRuntime.StateValue.newNull());
    state_0.data = new __compactRuntime.ChargedState(stateValue_0);
    state_0.setOperation('proveCompliance', new __compactRuntime.ContractOperation());
    const context = __compactRuntime.createCircuitContext(__compactRuntime.dummyContractAddress(), constructorContext_0.initialZswapLocalState.coinPublicKey, state_0.data, constructorContext_0.initialPrivateState);
    const partialProofData = {
      input: { value: [], alignment: [] },
      output: undefined,
      publicTranscript: [],
      privateTranscriptOutputs: []
    };
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_3.toValue(0n),
                                                                                              alignment: _descriptor_3.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newMap(
                                                          new __compactRuntime.StateMap()
                                                        ).encode() } },
                                       { ins: { cached: false, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_3.toValue(1n),
                                                                                              alignment: _descriptor_3.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(0n),
                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_3.toValue(2n),
                                                                                              alignment: _descriptor_3.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_3.toValue(0n),
                                                                                              alignment: _descriptor_3.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_3.toValue(3n),
                                                                                              alignment: _descriptor_3.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_5.toValue(0n),
                                                                                              alignment: _descriptor_5.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_3.toValue(4n),
                                                                                              alignment: _descriptor_3.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newMap(
                                                          new __compactRuntime.StateMap()
                                                        ).encode() } },
                                       { ins: { cached: false, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_3.toValue(1n),
                                                                                              alignment: _descriptor_3.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(limit_0),
                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_3.toValue(2n),
                                                                                              alignment: _descriptor_3.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_3.toValue(brakeLimit_0),
                                                                                              alignment: _descriptor_3.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } }]);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_3.toValue(0n),
                                                                  alignment: _descriptor_3.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(attestorId_0),
                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(attestorPk_0),
                                                                                              alignment: _descriptor_1.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    state_0.data = new __compactRuntime.ChargedState(context.currentQueryContext.state.state);
    return {
      currentContractState: state_0,
      currentPrivateState: context.currentPrivateState,
      currentZswapLocalState: context.currentZswapLocalState
    }
  }
  _transientHash_0(value_0) {
    const result_0 = __compactRuntime.transientHash(_descriptor_9, value_0);
    return result_0;
  }
  _transientHash_1(value_0) {
    const result_0 = __compactRuntime.transientHash(_descriptor_23, value_0);
    return result_0;
  }
  _transientHash_2(value_0) {
    const result_0 = __compactRuntime.transientHash(_descriptor_19, value_0);
    return result_0;
  }
  _transientHash_3(value_0) {
    const result_0 = __compactRuntime.transientHash(_descriptor_21, value_0);
    return result_0;
  }
  _transientHash_4(value_0) {
    const result_0 = __compactRuntime.transientHash(_descriptor_16, value_0);
    return result_0;
  }
  _persistentHash_0(value_0) {
    const result_0 = __compactRuntime.persistentHash(_descriptor_18, value_0);
    return result_0;
  }
  _jubjubPointX_0(np_0) {
    const result_0 = __compactRuntime.jubjubPointX(np_0);
    return result_0;
  }
  _jubjubPointY_0(np_0) {
    const result_0 = __compactRuntime.jubjubPointY(np_0);
    return result_0;
  }
  _ecAdd_0(a_0, b_0) {
    const result_0 = __compactRuntime.ecAdd(a_0, b_0);
    return result_0;
  }
  _ecMul_0(a_0, b_0) {
    const result_0 = __compactRuntime.ecMul(a_0, b_0);
    return result_0;
  }
  _ecMulGenerator_0(b_0) {
    const result_0 = __compactRuntime.ecMulGenerator(b_0);
    return result_0;
  }
  _getSchnorrReduction_0(context, partialProofData, challengeHash_0) {
    const witnessContext_0 = __compactRuntime.createWitnessContext(ledger(context.currentQueryContext.state), context.currentPrivateState, context.currentQueryContext.address);
    const [nextPrivateState_0, result_0] = this.witnesses.getSchnorrReduction(witnessContext_0,
                                                                              challengeHash_0);
    context.currentPrivateState = nextPrivateState_0;
    if (!(Array.isArray(result_0) && result_0.length === 2  && typeof(result_0[0]) === 'bigint' && result_0[0] >= 0n && result_0[0] <= 127n && typeof(result_0[1]) === 'bigint' && result_0[1] >= 0n && result_0[1] <= 452312848583266388373324160190187140051835877600158453279131187530910662655n)) {
      __compactRuntime.typeError('getSchnorrReduction',
                                 'return value',
                                 'schnorr.compact line 21 char 3',
                                 '[Uint<0..128>, Uint<0..452312848583266388373324160190187140051835877600158453279131187530910662656>]',
                                 result_0)
    }
    partialProofData.privateTranscriptOutputs.push({
      value: _descriptor_15.toValue(result_0),
      alignment: _descriptor_15.alignment()
    });
    return result_0;
  }
  _schnorrVerify_0(context, partialProofData, msg_0, signature_0, pk_0) {
    const __compact_pattern_tmp2_0 = signature_0;
    const announcement_0 = __compact_pattern_tmp2_0.announcement;
    const response_0 = __compact_pattern_tmp2_0.response;
    const cFull_0 = this._transientHash_4({ ann_x:
                                              this._jubjubPointX_0(announcement_0),
                                            ann_y:
                                              this._jubjubPointY_0(announcement_0),
                                            pk_x: this._jubjubPointX_0(pk_0),
                                            pk_y: this._jubjubPointY_0(pk_0),
                                            msg: msg_0 });
    const TWO_248_0 = 452312848583266388373324160190187140051835877600158453279131187530910662656n;
    const __compact_pattern_tmp1_0 = this._getSchnorrReduction_0(context,
                                                                 partialProofData,
                                                                 cFull_0);
    const q_0 = __compact_pattern_tmp1_0[0];
    const cTruncated_0 = __compact_pattern_tmp1_0[1];
    let t_0;
    __compactRuntime.assert((t_0 = q_0, t_0 < 116n),
                            'Schnorr quotient out of range');
    __compactRuntime.assert(__compactRuntime.addField(__compactRuntime.mulField(q_0,
                                                                                TWO_248_0),
                                                      cTruncated_0)
                            ===
                            cFull_0,
                            'Invalid challenge reduction');
    const c_0 = cTruncated_0;
    const lhs_0 = this._ecMulGenerator_0(response_0);
    const rhs_0 = this._ecAdd_0(announcement_0, this._ecMul_0(pk_0, c_0));
    __compactRuntime.assert(this._jubjubPointX_0(lhs_0)
                            ===
                            this._jubjubPointX_0(rhs_0)
                            &&
                            this._jubjubPointY_0(lhs_0)
                            ===
                            this._jubjubPointY_0(rhs_0),
                            'Invalid attestation signature');
    return [];
  }
  _schnorrChallenge1_0(ann_x_0, ann_y_0, pk_x_0, pk_y_0, msg_0) {
    return this._transientHash_4({ ann_x: ann_x_0,
                                   ann_y: ann_y_0,
                                   pk_x: pk_x_0,
                                   pk_y: pk_y_0,
                                   msg: msg_0 });
  }
  _getAttestedTripWitness_0(context, partialProofData) {
    const witnessContext_0 = __compactRuntime.createWitnessContext(ledger(context.currentQueryContext.state), context.currentPrivateState, context.currentQueryContext.address);
    const [nextPrivateState_0, result_0] = this.witnesses.getAttestedTripWitness(witnessContext_0);
    context.currentPrivateState = nextPrivateState_0;
    if (!(Array.isArray(result_0) && result_0.length === 3  && typeof(result_0[0]) === 'object' && typeof(result_0[0].attestationId) === 'bigint' && result_0[0].attestationId >= 0 && result_0[0].attestationId <= __compactRuntime.MAX_FIELD && typeof(result_0[0].salt) === 'bigint' && result_0[0].salt >= 0 && result_0[0].salt <= __compactRuntime.MAX_FIELD && Array.isArray(result_0[0].gridX) && result_0[0].gridX.length === 16 && result_0[0].gridX.every((t) => typeof(t) === 'bigint' && t >= 0n && t <= 65535n) && Array.isArray(result_0[0].gridY) && result_0[0].gridY.length === 16 && result_0[0].gridY.every((t) => typeof(t) === 'bigint' && t >= 0n && t <= 65535n) && Array.isArray(result_0[0].speed) && result_0[0].speed.length === 16 && result_0[0].speed.every((t) => typeof(t) === 'bigint' && t >= 0n && t <= 65535n) && Array.isArray(result_0[0].braking) && result_0[0].braking.length === 16 && result_0[0].braking.every((t) => typeof(t) === 'bigint' && t >= 0n && t <= 255n) && Array.isArray(result_0[0].timeBucket) && result_0[0].timeBucket.length === 16 && result_0[0].timeBucket.every((t) => typeof(t) === 'bigint' && t >= 0n && t <= 255n) && typeof(result_0[1]) === 'object' && true && typeof(result_0[1].response) === 'bigint' && result_0[1].response >= 0 && result_0[1].response <= __compactRuntime.MAX_FIELD && typeof(result_0[2]) === 'bigint' && result_0[2] >= 0n && result_0[2] <= 65535n)) {
      __compactRuntime.typeError('getAttestedTripWitness',
                                 'return value',
                                 'driveproof.compact line 38 char 1',
                                 '[struct TripReading<attestationId: Field, salt: Field, gridX: Vector<16, Uint<0..65536>>, gridY: Vector<16, Uint<0..65536>>, speed: Vector<16, Uint<0..65536>>, braking: Vector<16, Uint<0..256>>, timeBucket: Vector<16, Uint<0..256>>>, struct SchnorrSignature<announcement: Opaque<"JubjubPoint">, response: Field>, Uint<0..65536>]',
                                 result_0)
    }
    partialProofData.privateTranscriptOutputs.push({
      value: _descriptor_12.toValue(result_0),
      alignment: _descriptor_12.alignment()
    });
    return result_0;
  }
  _getDriverSecret_0(context, partialProofData) {
    const witnessContext_0 = __compactRuntime.createWitnessContext(ledger(context.currentQueryContext.state), context.currentPrivateState, context.currentQueryContext.address);
    const [nextPrivateState_0, result_0] = this.witnesses.getDriverSecret(witnessContext_0);
    context.currentPrivateState = nextPrivateState_0;
    if (!(result_0.buffer instanceof ArrayBuffer && result_0.BYTES_PER_ELEMENT === 1 && result_0.length === 32)) {
      __compactRuntime.typeError('getDriverSecret',
                                 'return value',
                                 'driveproof.compact line 39 char 1',
                                 'Bytes<32>',
                                 result_0)
    }
    partialProofData.privateTranscriptOutputs.push({
      value: _descriptor_9.toValue(result_0),
      alignment: _descriptor_9.alignment()
    });
    return result_0;
  }
  _deriveDriverBinding_0(secret_0) {
    const bindingBytes_0 = this._persistentHash_0([new Uint8Array([68, 82, 73, 86, 69, 80, 82, 79, 79, 70, 95, 83, 85, 66, 74, 69, 67, 84, 95, 86, 49]),
                                                   secret_0]);
    return this._transientHash_0(bindingBytes_0);
  }
  _deriveNullifier_0(attestationId_0) {
    return this._transientHash_1([new Uint8Array([68, 82, 73, 86, 69, 80, 82, 79, 79, 70, 95, 78, 85, 76, 76, 73, 70, 73, 69, 82, 95, 86, 49]),
                                  attestationId_0]);
  }
  _foldTripSample_0(prev_0, gridX_0, gridY_0, speed_0, braking_0, timeBucket_0)
  {
    return this._transientHash_2({ prev: prev_0,
                                   gridX: gridX_0,
                                   gridY: gridY_0,
                                   speed: speed_0,
                                   braking: braking_0,
                                   timeBucket: timeBucket_0 });
  }
  _deriveTripCommitment_0(attestationId_0,
                          driverBinding_0,
                          salt_0,
                          gridX_0,
                          gridY_0,
                          speed_0,
                          braking_0,
                          timeBucket_0)
  {
    const seed_0 = this._transientHash_3([new Uint8Array([68, 82, 73, 86, 69, 80, 82, 79, 79, 70, 95, 65, 84, 84, 69, 83, 84, 65, 84, 73, 79, 78, 95, 86, 49]),
                                          attestationId_0,
                                          driverBinding_0,
                                          salt_0]);
    const h0_0 = this._foldTripSample_0(seed_0,
                                        gridX_0[0],
                                        gridY_0[0],
                                        speed_0[0],
                                        braking_0[0],
                                        timeBucket_0[0]);
    const h1_0 = this._foldTripSample_0(h0_0,
                                        gridX_0[1],
                                        gridY_0[1],
                                        speed_0[1],
                                        braking_0[1],
                                        timeBucket_0[1]);
    const h2_0 = this._foldTripSample_0(h1_0,
                                        gridX_0[2],
                                        gridY_0[2],
                                        speed_0[2],
                                        braking_0[2],
                                        timeBucket_0[2]);
    const h3_0 = this._foldTripSample_0(h2_0,
                                        gridX_0[3],
                                        gridY_0[3],
                                        speed_0[3],
                                        braking_0[3],
                                        timeBucket_0[3]);
    const h4_0 = this._foldTripSample_0(h3_0,
                                        gridX_0[4],
                                        gridY_0[4],
                                        speed_0[4],
                                        braking_0[4],
                                        timeBucket_0[4]);
    const h5_0 = this._foldTripSample_0(h4_0,
                                        gridX_0[5],
                                        gridY_0[5],
                                        speed_0[5],
                                        braking_0[5],
                                        timeBucket_0[5]);
    const h6_0 = this._foldTripSample_0(h5_0,
                                        gridX_0[6],
                                        gridY_0[6],
                                        speed_0[6],
                                        braking_0[6],
                                        timeBucket_0[6]);
    const h7_0 = this._foldTripSample_0(h6_0,
                                        gridX_0[7],
                                        gridY_0[7],
                                        speed_0[7],
                                        braking_0[7],
                                        timeBucket_0[7]);
    const h8_0 = this._foldTripSample_0(h7_0,
                                        gridX_0[8],
                                        gridY_0[8],
                                        speed_0[8],
                                        braking_0[8],
                                        timeBucket_0[8]);
    const h9_0 = this._foldTripSample_0(h8_0,
                                        gridX_0[9],
                                        gridY_0[9],
                                        speed_0[9],
                                        braking_0[9],
                                        timeBucket_0[9]);
    const h10_0 = this._foldTripSample_0(h9_0,
                                         gridX_0[10],
                                         gridY_0[10],
                                         speed_0[10],
                                         braking_0[10],
                                         timeBucket_0[10]);
    const h11_0 = this._foldTripSample_0(h10_0,
                                         gridX_0[11],
                                         gridY_0[11],
                                         speed_0[11],
                                         braking_0[11],
                                         timeBucket_0[11]);
    const h12_0 = this._foldTripSample_0(h11_0,
                                         gridX_0[12],
                                         gridY_0[12],
                                         speed_0[12],
                                         braking_0[12],
                                         timeBucket_0[12]);
    const h13_0 = this._foldTripSample_0(h12_0,
                                         gridX_0[13],
                                         gridY_0[13],
                                         speed_0[13],
                                         braking_0[13],
                                         timeBucket_0[13]);
    const h14_0 = this._foldTripSample_0(h13_0,
                                         gridX_0[14],
                                         gridY_0[14],
                                         speed_0[14],
                                         braking_0[14],
                                         timeBucket_0[14]);
    return this._foldTripSample_0(h14_0,
                                  gridX_0[15],
                                  gridY_0[15],
                                  speed_0[15],
                                  braking_0[15],
                                  timeBucket_0[15]);
  }
  _harshBrakingFlag_0(braking_0) { return braking_0 > 0n ? 1n : 0n; }
  _countHarshBraking_0(braking_0) {
    const c0_0 = this._harshBrakingFlag_0(braking_0[0]);
    const c1_0 = ((t1) => {
                   if (t1 > 255n) {
                     throw new __compactRuntime.CompactError('driveproof.compact line 120 char 16: cast from Field or Uint value to smaller Uint value failed: ' + t1 + ' is greater than 255');
                   }
                   return t1;
                 })(c0_0 + this._harshBrakingFlag_0(braking_0[1]));
    const c2_0 = ((t1) => {
                   if (t1 > 255n) {
                     throw new __compactRuntime.CompactError('driveproof.compact line 121 char 16: cast from Field or Uint value to smaller Uint value failed: ' + t1 + ' is greater than 255');
                   }
                   return t1;
                 })(c1_0 + this._harshBrakingFlag_0(braking_0[2]));
    const c3_0 = ((t1) => {
                   if (t1 > 255n) {
                     throw new __compactRuntime.CompactError('driveproof.compact line 122 char 16: cast from Field or Uint value to smaller Uint value failed: ' + t1 + ' is greater than 255');
                   }
                   return t1;
                 })(c2_0 + this._harshBrakingFlag_0(braking_0[3]));
    const c4_0 = ((t1) => {
                   if (t1 > 255n) {
                     throw new __compactRuntime.CompactError('driveproof.compact line 123 char 16: cast from Field or Uint value to smaller Uint value failed: ' + t1 + ' is greater than 255');
                   }
                   return t1;
                 })(c3_0 + this._harshBrakingFlag_0(braking_0[4]));
    const c5_0 = ((t1) => {
                   if (t1 > 255n) {
                     throw new __compactRuntime.CompactError('driveproof.compact line 124 char 16: cast from Field or Uint value to smaller Uint value failed: ' + t1 + ' is greater than 255');
                   }
                   return t1;
                 })(c4_0 + this._harshBrakingFlag_0(braking_0[5]));
    const c6_0 = ((t1) => {
                   if (t1 > 255n) {
                     throw new __compactRuntime.CompactError('driveproof.compact line 125 char 16: cast from Field or Uint value to smaller Uint value failed: ' + t1 + ' is greater than 255');
                   }
                   return t1;
                 })(c5_0 + this._harshBrakingFlag_0(braking_0[6]));
    const c7_0 = ((t1) => {
                   if (t1 > 255n) {
                     throw new __compactRuntime.CompactError('driveproof.compact line 126 char 16: cast from Field or Uint value to smaller Uint value failed: ' + t1 + ' is greater than 255');
                   }
                   return t1;
                 })(c6_0 + this._harshBrakingFlag_0(braking_0[7]));
    const c8_0 = ((t1) => {
                   if (t1 > 255n) {
                     throw new __compactRuntime.CompactError('driveproof.compact line 127 char 16: cast from Field or Uint value to smaller Uint value failed: ' + t1 + ' is greater than 255');
                   }
                   return t1;
                 })(c7_0 + this._harshBrakingFlag_0(braking_0[8]));
    const c9_0 = ((t1) => {
                   if (t1 > 255n) {
                     throw new __compactRuntime.CompactError('driveproof.compact line 128 char 16: cast from Field or Uint value to smaller Uint value failed: ' + t1 + ' is greater than 255');
                   }
                   return t1;
                 })(c8_0 + this._harshBrakingFlag_0(braking_0[9]));
    const c10_0 = ((t1) => {
                    if (t1 > 255n) {
                      throw new __compactRuntime.CompactError('driveproof.compact line 129 char 17: cast from Field or Uint value to smaller Uint value failed: ' + t1 + ' is greater than 255');
                    }
                    return t1;
                  })(c9_0 + this._harshBrakingFlag_0(braking_0[10]));
    const c11_0 = ((t1) => {
                    if (t1 > 255n) {
                      throw new __compactRuntime.CompactError('driveproof.compact line 130 char 17: cast from Field or Uint value to smaller Uint value failed: ' + t1 + ' is greater than 255');
                    }
                    return t1;
                  })(c10_0 + this._harshBrakingFlag_0(braking_0[11]));
    const c12_0 = ((t1) => {
                    if (t1 > 255n) {
                      throw new __compactRuntime.CompactError('driveproof.compact line 131 char 17: cast from Field or Uint value to smaller Uint value failed: ' + t1 + ' is greater than 255');
                    }
                    return t1;
                  })(c11_0 + this._harshBrakingFlag_0(braking_0[12]));
    const c13_0 = ((t1) => {
                    if (t1 > 255n) {
                      throw new __compactRuntime.CompactError('driveproof.compact line 132 char 17: cast from Field or Uint value to smaller Uint value failed: ' + t1 + ' is greater than 255');
                    }
                    return t1;
                  })(c12_0 + this._harshBrakingFlag_0(braking_0[13]));
    const c14_0 = ((t1) => {
                    if (t1 > 255n) {
                      throw new __compactRuntime.CompactError('driveproof.compact line 133 char 17: cast from Field or Uint value to smaller Uint value failed: ' + t1 + ' is greater than 255');
                    }
                    return t1;
                  })(c13_0 + this._harshBrakingFlag_0(braking_0[14]));
    return ((t1) => {
             if (t1 > 255n) {
               throw new __compactRuntime.CompactError('driveproof.compact line 134 char 12: cast from Field or Uint value to smaller Uint value failed: ' + t1 + ' is greater than 255');
             }
             return t1;
           })(c14_0 + this._harshBrakingFlag_0(braking_0[15]));
  }
  _proveCompliance_0(context, partialProofData) {
    const __compact_pattern_tmp1_0 = this._getAttestedTripWitness_0(context,
                                                                    partialProofData);
    const reading_0 = __compact_pattern_tmp1_0[0];
    const signature_0 = __compact_pattern_tmp1_0[1];
    const attestorId_0 = __compact_pattern_tmp1_0[2];
    __compactRuntime.assert(_descriptor_2.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                      partialProofData,
                                                                                      [
                                                                                       { dup: { n: 0 } },
                                                                                       { idx: { cached: false,
                                                                                                pushPath: false,
                                                                                                path: [
                                                                                                       { tag: 'value',
                                                                                                         value: { value: _descriptor_3.toValue(0n),
                                                                                                                  alignment: _descriptor_3.alignment() } }] } },
                                                                                       { push: { storage: false,
                                                                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(attestorId_0),
                                                                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                                                                       'member',
                                                                                       { popeq: { cached: true,
                                                                                                  result: undefined } }]).value),
                            'Attestor not registered');
    const attestorPk_0 = _descriptor_1.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                   partialProofData,
                                                                                   [
                                                                                    { dup: { n: 0 } },
                                                                                    { idx: { cached: false,
                                                                                             pushPath: false,
                                                                                             path: [
                                                                                                    { tag: 'value',
                                                                                                      value: { value: _descriptor_3.toValue(0n),
                                                                                                               alignment: _descriptor_3.alignment() } }] } },
                                                                                    { idx: { cached: false,
                                                                                             pushPath: false,
                                                                                             path: [
                                                                                                    { tag: 'value',
                                                                                                      value: { value: _descriptor_0.toValue(attestorId_0),
                                                                                                               alignment: _descriptor_0.alignment() } }] } },
                                                                                    { popeq: { cached: false,
                                                                                               result: undefined } }]).value);
    const driverBinding_0 = this._deriveDriverBinding_0(this._getDriverSecret_0(context,
                                                                                partialProofData));
    const tripCommitment_0 = this._deriveTripCommitment_0(reading_0.attestationId,
                                                          driverBinding_0,
                                                          reading_0.salt,
                                                          reading_0.gridX,
                                                          reading_0.gridY,
                                                          reading_0.speed,
                                                          reading_0.braking,
                                                          reading_0.timeBucket);
    const msg_0 = [tripCommitment_0];
    this._schnorrVerify_0(context,
                          partialProofData,
                          msg_0,
                          signature_0,
                          attestorPk_0);
    let t_0;
    __compactRuntime.assert((t_0 = reading_0.speed[0],
                             t_0
                             <=
                             _descriptor_0.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                       partialProofData,
                                                                                       [
                                                                                        { dup: { n: 0 } },
                                                                                        { idx: { cached: false,
                                                                                                 pushPath: false,
                                                                                                 path: [
                                                                                                        { tag: 'value',
                                                                                                          value: { value: _descriptor_3.toValue(1n),
                                                                                                                   alignment: _descriptor_3.alignment() } }] } },
                                                                                        { popeq: { cached: false,
                                                                                                   result: undefined } }]).value)),
                            'Speed exceeds policy limit');
    let t_1;
    __compactRuntime.assert((t_1 = reading_0.speed[1],
                             t_1
                             <=
                             _descriptor_0.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                       partialProofData,
                                                                                       [
                                                                                        { dup: { n: 0 } },
                                                                                        { idx: { cached: false,
                                                                                                 pushPath: false,
                                                                                                 path: [
                                                                                                        { tag: 'value',
                                                                                                          value: { value: _descriptor_3.toValue(1n),
                                                                                                                   alignment: _descriptor_3.alignment() } }] } },
                                                                                        { popeq: { cached: false,
                                                                                                   result: undefined } }]).value)),
                            'Speed exceeds policy limit');
    let t_2;
    __compactRuntime.assert((t_2 = reading_0.speed[2],
                             t_2
                             <=
                             _descriptor_0.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                       partialProofData,
                                                                                       [
                                                                                        { dup: { n: 0 } },
                                                                                        { idx: { cached: false,
                                                                                                 pushPath: false,
                                                                                                 path: [
                                                                                                        { tag: 'value',
                                                                                                          value: { value: _descriptor_3.toValue(1n),
                                                                                                                   alignment: _descriptor_3.alignment() } }] } },
                                                                                        { popeq: { cached: false,
                                                                                                   result: undefined } }]).value)),
                            'Speed exceeds policy limit');
    let t_3;
    __compactRuntime.assert((t_3 = reading_0.speed[3],
                             t_3
                             <=
                             _descriptor_0.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                       partialProofData,
                                                                                       [
                                                                                        { dup: { n: 0 } },
                                                                                        { idx: { cached: false,
                                                                                                 pushPath: false,
                                                                                                 path: [
                                                                                                        { tag: 'value',
                                                                                                          value: { value: _descriptor_3.toValue(1n),
                                                                                                                   alignment: _descriptor_3.alignment() } }] } },
                                                                                        { popeq: { cached: false,
                                                                                                   result: undefined } }]).value)),
                            'Speed exceeds policy limit');
    let t_4;
    __compactRuntime.assert((t_4 = reading_0.speed[4],
                             t_4
                             <=
                             _descriptor_0.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                       partialProofData,
                                                                                       [
                                                                                        { dup: { n: 0 } },
                                                                                        { idx: { cached: false,
                                                                                                 pushPath: false,
                                                                                                 path: [
                                                                                                        { tag: 'value',
                                                                                                          value: { value: _descriptor_3.toValue(1n),
                                                                                                                   alignment: _descriptor_3.alignment() } }] } },
                                                                                        { popeq: { cached: false,
                                                                                                   result: undefined } }]).value)),
                            'Speed exceeds policy limit');
    let t_5;
    __compactRuntime.assert((t_5 = reading_0.speed[5],
                             t_5
                             <=
                             _descriptor_0.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                       partialProofData,
                                                                                       [
                                                                                        { dup: { n: 0 } },
                                                                                        { idx: { cached: false,
                                                                                                 pushPath: false,
                                                                                                 path: [
                                                                                                        { tag: 'value',
                                                                                                          value: { value: _descriptor_3.toValue(1n),
                                                                                                                   alignment: _descriptor_3.alignment() } }] } },
                                                                                        { popeq: { cached: false,
                                                                                                   result: undefined } }]).value)),
                            'Speed exceeds policy limit');
    let t_6;
    __compactRuntime.assert((t_6 = reading_0.speed[6],
                             t_6
                             <=
                             _descriptor_0.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                       partialProofData,
                                                                                       [
                                                                                        { dup: { n: 0 } },
                                                                                        { idx: { cached: false,
                                                                                                 pushPath: false,
                                                                                                 path: [
                                                                                                        { tag: 'value',
                                                                                                          value: { value: _descriptor_3.toValue(1n),
                                                                                                                   alignment: _descriptor_3.alignment() } }] } },
                                                                                        { popeq: { cached: false,
                                                                                                   result: undefined } }]).value)),
                            'Speed exceeds policy limit');
    let t_7;
    __compactRuntime.assert((t_7 = reading_0.speed[7],
                             t_7
                             <=
                             _descriptor_0.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                       partialProofData,
                                                                                       [
                                                                                        { dup: { n: 0 } },
                                                                                        { idx: { cached: false,
                                                                                                 pushPath: false,
                                                                                                 path: [
                                                                                                        { tag: 'value',
                                                                                                          value: { value: _descriptor_3.toValue(1n),
                                                                                                                   alignment: _descriptor_3.alignment() } }] } },
                                                                                        { popeq: { cached: false,
                                                                                                   result: undefined } }]).value)),
                            'Speed exceeds policy limit');
    let t_8;
    __compactRuntime.assert((t_8 = reading_0.speed[8],
                             t_8
                             <=
                             _descriptor_0.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                       partialProofData,
                                                                                       [
                                                                                        { dup: { n: 0 } },
                                                                                        { idx: { cached: false,
                                                                                                 pushPath: false,
                                                                                                 path: [
                                                                                                        { tag: 'value',
                                                                                                          value: { value: _descriptor_3.toValue(1n),
                                                                                                                   alignment: _descriptor_3.alignment() } }] } },
                                                                                        { popeq: { cached: false,
                                                                                                   result: undefined } }]).value)),
                            'Speed exceeds policy limit');
    let t_9;
    __compactRuntime.assert((t_9 = reading_0.speed[9],
                             t_9
                             <=
                             _descriptor_0.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                       partialProofData,
                                                                                       [
                                                                                        { dup: { n: 0 } },
                                                                                        { idx: { cached: false,
                                                                                                 pushPath: false,
                                                                                                 path: [
                                                                                                        { tag: 'value',
                                                                                                          value: { value: _descriptor_3.toValue(1n),
                                                                                                                   alignment: _descriptor_3.alignment() } }] } },
                                                                                        { popeq: { cached: false,
                                                                                                   result: undefined } }]).value)),
                            'Speed exceeds policy limit');
    let t_10;
    __compactRuntime.assert((t_10 = reading_0.speed[10],
                             t_10
                             <=
                             _descriptor_0.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                       partialProofData,
                                                                                       [
                                                                                        { dup: { n: 0 } },
                                                                                        { idx: { cached: false,
                                                                                                 pushPath: false,
                                                                                                 path: [
                                                                                                        { tag: 'value',
                                                                                                          value: { value: _descriptor_3.toValue(1n),
                                                                                                                   alignment: _descriptor_3.alignment() } }] } },
                                                                                        { popeq: { cached: false,
                                                                                                   result: undefined } }]).value)),
                            'Speed exceeds policy limit');
    let t_11;
    __compactRuntime.assert((t_11 = reading_0.speed[11],
                             t_11
                             <=
                             _descriptor_0.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                       partialProofData,
                                                                                       [
                                                                                        { dup: { n: 0 } },
                                                                                        { idx: { cached: false,
                                                                                                 pushPath: false,
                                                                                                 path: [
                                                                                                        { tag: 'value',
                                                                                                          value: { value: _descriptor_3.toValue(1n),
                                                                                                                   alignment: _descriptor_3.alignment() } }] } },
                                                                                        { popeq: { cached: false,
                                                                                                   result: undefined } }]).value)),
                            'Speed exceeds policy limit');
    let t_12;
    __compactRuntime.assert((t_12 = reading_0.speed[12],
                             t_12
                             <=
                             _descriptor_0.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                       partialProofData,
                                                                                       [
                                                                                        { dup: { n: 0 } },
                                                                                        { idx: { cached: false,
                                                                                                 pushPath: false,
                                                                                                 path: [
                                                                                                        { tag: 'value',
                                                                                                          value: { value: _descriptor_3.toValue(1n),
                                                                                                                   alignment: _descriptor_3.alignment() } }] } },
                                                                                        { popeq: { cached: false,
                                                                                                   result: undefined } }]).value)),
                            'Speed exceeds policy limit');
    let t_13;
    __compactRuntime.assert((t_13 = reading_0.speed[13],
                             t_13
                             <=
                             _descriptor_0.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                       partialProofData,
                                                                                       [
                                                                                        { dup: { n: 0 } },
                                                                                        { idx: { cached: false,
                                                                                                 pushPath: false,
                                                                                                 path: [
                                                                                                        { tag: 'value',
                                                                                                          value: { value: _descriptor_3.toValue(1n),
                                                                                                                   alignment: _descriptor_3.alignment() } }] } },
                                                                                        { popeq: { cached: false,
                                                                                                   result: undefined } }]).value)),
                            'Speed exceeds policy limit');
    let t_14;
    __compactRuntime.assert((t_14 = reading_0.speed[14],
                             t_14
                             <=
                             _descriptor_0.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                       partialProofData,
                                                                                       [
                                                                                        { dup: { n: 0 } },
                                                                                        { idx: { cached: false,
                                                                                                 pushPath: false,
                                                                                                 path: [
                                                                                                        { tag: 'value',
                                                                                                          value: { value: _descriptor_3.toValue(1n),
                                                                                                                   alignment: _descriptor_3.alignment() } }] } },
                                                                                        { popeq: { cached: false,
                                                                                                   result: undefined } }]).value)),
                            'Speed exceeds policy limit');
    let t_15;
    __compactRuntime.assert((t_15 = reading_0.speed[15],
                             t_15
                             <=
                             _descriptor_0.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                       partialProofData,
                                                                                       [
                                                                                        { dup: { n: 0 } },
                                                                                        { idx: { cached: false,
                                                                                                 pushPath: false,
                                                                                                 path: [
                                                                                                        { tag: 'value',
                                                                                                          value: { value: _descriptor_3.toValue(1n),
                                                                                                                   alignment: _descriptor_3.alignment() } }] } },
                                                                                        { popeq: { cached: false,
                                                                                                   result: undefined } }]).value)),
                            'Speed exceeds policy limit');
    const harshCount_0 = this._countHarshBraking_0(reading_0.braking);
    __compactRuntime.assert(harshCount_0
                            <=
                            _descriptor_3.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                      partialProofData,
                                                                                      [
                                                                                       { dup: { n: 0 } },
                                                                                       { idx: { cached: false,
                                                                                                pushPath: false,
                                                                                                path: [
                                                                                                       { tag: 'value',
                                                                                                         value: { value: _descriptor_3.toValue(2n),
                                                                                                                  alignment: _descriptor_3.alignment() } }] } },
                                                                                       { popeq: { cached: false,
                                                                                                  result: undefined } }]).value),
                            'Harsh braking exceeds policy limit');
    const nullifier_0 = this._deriveNullifier_0(reading_0.attestationId);
    __compactRuntime.assert(!_descriptor_2.fromValue(__compactRuntime.queryLedgerState(context,
                                                                                       partialProofData,
                                                                                       [
                                                                                        { dup: { n: 0 } },
                                                                                        { idx: { cached: false,
                                                                                                 pushPath: false,
                                                                                                 path: [
                                                                                                        { tag: 'value',
                                                                                                          value: { value: _descriptor_3.toValue(4n),
                                                                                                                   alignment: _descriptor_3.alignment() } }] } },
                                                                                        { push: { storage: false,
                                                                                                  value: __compactRuntime.StateValue.newCell({ value: _descriptor_4.toValue(nullifier_0),
                                                                                                                                               alignment: _descriptor_4.alignment() }).encode() } },
                                                                                        'member',
                                                                                        { popeq: { cached: true,
                                                                                                   result: undefined } }]).value),
                            'Attestation already used');
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { idx: { cached: false,
                                                pushPath: true,
                                                path: [
                                                       { tag: 'value',
                                                         value: { value: _descriptor_3.toValue(4n),
                                                                  alignment: _descriptor_3.alignment() } }] } },
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_4.toValue(nullifier_0),
                                                                                              alignment: _descriptor_4.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newNull().encode() } },
                                       { ins: { cached: false, n: 1 } },
                                       { ins: { cached: true, n: 1 } }]);
    const tmp_0 = ((t1) => {
                    if (t1 > 4294967295n) {
                      throw new __compactRuntime.CompactError('driveproof.compact line 181 char 32: cast from Field or Uint value to smaller Uint value failed: ' + t1 + ' is greater than 4294967295');
                    }
                    return t1;
                  })(_descriptor_5.fromValue(__compactRuntime.queryLedgerState(context,
                                                                               partialProofData,
                                                                               [
                                                                                { dup: { n: 0 } },
                                                                                { idx: { cached: false,
                                                                                         pushPath: false,
                                                                                         path: [
                                                                                                { tag: 'value',
                                                                                                  value: { value: _descriptor_3.toValue(3n),
                                                                                                           alignment: _descriptor_3.alignment() } }] } },
                                                                                { popeq: { cached: false,
                                                                                           result: undefined } }]).value)
                     +
                     1n);
    __compactRuntime.queryLedgerState(context,
                                      partialProofData,
                                      [
                                       { push: { storage: false,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_3.toValue(3n),
                                                                                              alignment: _descriptor_3.alignment() }).encode() } },
                                       { push: { storage: true,
                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_5.toValue(tmp_0),
                                                                                              alignment: _descriptor_5.alignment() }).encode() } },
                                       { ins: { cached: false, n: 1 } }]);
    return [];
  }
  _schnorrChallenge_0(ann_x_0, ann_y_0, pk_x_0, pk_y_0, msg_0) {
    return this._schnorrChallenge1_0(ann_x_0, ann_y_0, pk_x_0, pk_y_0, msg_0);
  }
}
export function ledger(stateOrChargedState) {
  const state = stateOrChargedState instanceof __compactRuntime.StateValue ? stateOrChargedState : stateOrChargedState.state;
  const chargedState = stateOrChargedState instanceof __compactRuntime.StateValue ? new __compactRuntime.ChargedState(stateOrChargedState) : stateOrChargedState;
  const context = {
    currentQueryContext: new __compactRuntime.QueryContext(chargedState, __compactRuntime.dummyContractAddress()),
    costModel: __compactRuntime.CostModel.initialCostModel()
  };
  const partialProofData = {
    input: { value: [], alignment: [] },
    output: undefined,
    publicTranscript: [],
    privateTranscriptOutputs: []
  };
  return {
    attestors: {
      isEmpty(...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`isEmpty: expected 0 arguments, received ${args_0.length}`);
        }
        return _descriptor_2.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_3.toValue(0n),
                                                                                                     alignment: _descriptor_3.alignment() } }] } },
                                                                          'size',
                                                                          { push: { storage: false,
                                                                                    value: __compactRuntime.StateValue.newCell({ value: _descriptor_24.toValue(0n),
                                                                                                                                 alignment: _descriptor_24.alignment() }).encode() } },
                                                                          'eq',
                                                                          { popeq: { cached: true,
                                                                                     result: undefined } }]).value);
      },
      size(...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`size: expected 0 arguments, received ${args_0.length}`);
        }
        return _descriptor_24.fromValue(__compactRuntime.queryLedgerState(context,
                                                                          partialProofData,
                                                                          [
                                                                           { dup: { n: 0 } },
                                                                           { idx: { cached: false,
                                                                                    pushPath: false,
                                                                                    path: [
                                                                                           { tag: 'value',
                                                                                             value: { value: _descriptor_3.toValue(0n),
                                                                                                      alignment: _descriptor_3.alignment() } }] } },
                                                                           'size',
                                                                           { popeq: { cached: true,
                                                                                      result: undefined } }]).value);
      },
      member(...args_0) {
        if (args_0.length !== 1) {
          throw new __compactRuntime.CompactError(`member: expected 1 argument, received ${args_0.length}`);
        }
        const key_0 = args_0[0];
        if (!(typeof(key_0) === 'bigint' && key_0 >= 0n && key_0 <= 65535n)) {
          __compactRuntime.typeError('member',
                                     'argument 1',
                                     'driveproof.compact line 32 char 1',
                                     'Uint<0..65536>',
                                     key_0)
        }
        return _descriptor_2.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_3.toValue(0n),
                                                                                                     alignment: _descriptor_3.alignment() } }] } },
                                                                          { push: { storage: false,
                                                                                    value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(key_0),
                                                                                                                                 alignment: _descriptor_0.alignment() }).encode() } },
                                                                          'member',
                                                                          { popeq: { cached: true,
                                                                                     result: undefined } }]).value);
      },
      lookup(...args_0) {
        if (args_0.length !== 1) {
          throw new __compactRuntime.CompactError(`lookup: expected 1 argument, received ${args_0.length}`);
        }
        const key_0 = args_0[0];
        if (!(typeof(key_0) === 'bigint' && key_0 >= 0n && key_0 <= 65535n)) {
          __compactRuntime.typeError('lookup',
                                     'argument 1',
                                     'driveproof.compact line 32 char 1',
                                     'Uint<0..65536>',
                                     key_0)
        }
        return _descriptor_1.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_3.toValue(0n),
                                                                                                     alignment: _descriptor_3.alignment() } }] } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_0.toValue(key_0),
                                                                                                     alignment: _descriptor_0.alignment() } }] } },
                                                                          { popeq: { cached: false,
                                                                                     result: undefined } }]).value);
      },
      [Symbol.iterator](...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`iter: expected 0 arguments, received ${args_0.length}`);
        }
        const self_0 = state.asArray()[0];
        return self_0.asMap().keys().map(  (key) => {    const value = self_0.asMap().get(key).asCell();    return [      _descriptor_0.fromValue(key.value),      _descriptor_1.fromValue(value.value)    ];  })[Symbol.iterator]();
      }
    },
    get speedLimit() {
      return _descriptor_0.fromValue(__compactRuntime.queryLedgerState(context,
                                                                       partialProofData,
                                                                       [
                                                                        { dup: { n: 0 } },
                                                                        { idx: { cached: false,
                                                                                 pushPath: false,
                                                                                 path: [
                                                                                        { tag: 'value',
                                                                                          value: { value: _descriptor_3.toValue(1n),
                                                                                                   alignment: _descriptor_3.alignment() } }] } },
                                                                        { popeq: { cached: false,
                                                                                   result: undefined } }]).value);
    },
    get brakingLimit() {
      return _descriptor_3.fromValue(__compactRuntime.queryLedgerState(context,
                                                                       partialProofData,
                                                                       [
                                                                        { dup: { n: 0 } },
                                                                        { idx: { cached: false,
                                                                                 pushPath: false,
                                                                                 path: [
                                                                                        { tag: 'value',
                                                                                          value: { value: _descriptor_3.toValue(2n),
                                                                                                   alignment: _descriptor_3.alignment() } }] } },
                                                                        { popeq: { cached: false,
                                                                                   result: undefined } }]).value);
    },
    get complianceCount() {
      return _descriptor_5.fromValue(__compactRuntime.queryLedgerState(context,
                                                                       partialProofData,
                                                                       [
                                                                        { dup: { n: 0 } },
                                                                        { idx: { cached: false,
                                                                                 pushPath: false,
                                                                                 path: [
                                                                                        { tag: 'value',
                                                                                          value: { value: _descriptor_3.toValue(3n),
                                                                                                   alignment: _descriptor_3.alignment() } }] } },
                                                                        { popeq: { cached: false,
                                                                                   result: undefined } }]).value);
    },
    usedNullifiers: {
      isEmpty(...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`isEmpty: expected 0 arguments, received ${args_0.length}`);
        }
        return _descriptor_2.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_3.toValue(4n),
                                                                                                     alignment: _descriptor_3.alignment() } }] } },
                                                                          'size',
                                                                          { push: { storage: false,
                                                                                    value: __compactRuntime.StateValue.newCell({ value: _descriptor_24.toValue(0n),
                                                                                                                                 alignment: _descriptor_24.alignment() }).encode() } },
                                                                          'eq',
                                                                          { popeq: { cached: true,
                                                                                     result: undefined } }]).value);
      },
      size(...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`size: expected 0 arguments, received ${args_0.length}`);
        }
        return _descriptor_24.fromValue(__compactRuntime.queryLedgerState(context,
                                                                          partialProofData,
                                                                          [
                                                                           { dup: { n: 0 } },
                                                                           { idx: { cached: false,
                                                                                    pushPath: false,
                                                                                    path: [
                                                                                           { tag: 'value',
                                                                                             value: { value: _descriptor_3.toValue(4n),
                                                                                                      alignment: _descriptor_3.alignment() } }] } },
                                                                           'size',
                                                                           { popeq: { cached: true,
                                                                                      result: undefined } }]).value);
      },
      member(...args_0) {
        if (args_0.length !== 1) {
          throw new __compactRuntime.CompactError(`member: expected 1 argument, received ${args_0.length}`);
        }
        const elem_0 = args_0[0];
        if (!(typeof(elem_0) === 'bigint' && elem_0 >= 0 && elem_0 <= __compactRuntime.MAX_FIELD)) {
          __compactRuntime.typeError('member',
                                     'argument 1',
                                     'driveproof.compact line 36 char 1',
                                     'Field',
                                     elem_0)
        }
        return _descriptor_2.fromValue(__compactRuntime.queryLedgerState(context,
                                                                         partialProofData,
                                                                         [
                                                                          { dup: { n: 0 } },
                                                                          { idx: { cached: false,
                                                                                   pushPath: false,
                                                                                   path: [
                                                                                          { tag: 'value',
                                                                                            value: { value: _descriptor_3.toValue(4n),
                                                                                                     alignment: _descriptor_3.alignment() } }] } },
                                                                          { push: { storage: false,
                                                                                    value: __compactRuntime.StateValue.newCell({ value: _descriptor_4.toValue(elem_0),
                                                                                                                                 alignment: _descriptor_4.alignment() }).encode() } },
                                                                          'member',
                                                                          { popeq: { cached: true,
                                                                                     result: undefined } }]).value);
      },
      [Symbol.iterator](...args_0) {
        if (args_0.length !== 0) {
          throw new __compactRuntime.CompactError(`iter: expected 0 arguments, received ${args_0.length}`);
        }
        const self_0 = state.asArray()[4];
        return self_0.asMap().keys().map((elem) => _descriptor_4.fromValue(elem.value))[Symbol.iterator]();
      }
    }
  };
}
const _emptyContext = {
  currentQueryContext: new __compactRuntime.QueryContext(new __compactRuntime.ContractState().data, __compactRuntime.dummyContractAddress())
};
const _dummyContract = new Contract({
  getSchnorrReduction: (...args) => undefined,
  getAttestedTripWitness: (...args) => undefined,
  getDriverSecret: (...args) => undefined
});
export const pureCircuits = {
  deriveDriverBinding: (...args_0) => {
    if (args_0.length !== 1) {
      throw new __compactRuntime.CompactError(`deriveDriverBinding: expected 1 argument (as invoked from Typescript), received ${args_0.length}`);
    }
    const secret_0 = args_0[0];
    if (!(secret_0.buffer instanceof ArrayBuffer && secret_0.BYTES_PER_ELEMENT === 1 && secret_0.length === 32)) {
      __compactRuntime.typeError('deriveDriverBinding',
                                 'argument 1',
                                 'driveproof.compact line 47 char 1',
                                 'Bytes<32>',
                                 secret_0)
    }
    return _dummyContract._deriveDriverBinding_0(secret_0);
  },
  deriveNullifier: (...args_0) => {
    if (args_0.length !== 1) {
      throw new __compactRuntime.CompactError(`deriveNullifier: expected 1 argument (as invoked from Typescript), received ${args_0.length}`);
    }
    const attestationId_0 = args_0[0];
    if (!(typeof(attestationId_0) === 'bigint' && attestationId_0 >= 0 && attestationId_0 <= __compactRuntime.MAX_FIELD)) {
      __compactRuntime.typeError('deriveNullifier',
                                 'argument 1',
                                 'driveproof.compact line 55 char 1',
                                 'Field',
                                 attestationId_0)
    }
    return _dummyContract._deriveNullifier_0(attestationId_0);
  },
  foldTripSample: (...args_0) => {
    if (args_0.length !== 6) {
      throw new __compactRuntime.CompactError(`foldTripSample: expected 6 arguments (as invoked from Typescript), received ${args_0.length}`);
    }
    const prev_0 = args_0[0];
    const gridX_0 = args_0[1];
    const gridY_0 = args_0[2];
    const speed_0 = args_0[3];
    const braking_0 = args_0[4];
    const timeBucket_0 = args_0[5];
    if (!(typeof(prev_0) === 'bigint' && prev_0 >= 0 && prev_0 <= __compactRuntime.MAX_FIELD)) {
      __compactRuntime.typeError('foldTripSample',
                                 'argument 1',
                                 'driveproof.compact line 62 char 1',
                                 'Field',
                                 prev_0)
    }
    if (!(typeof(gridX_0) === 'bigint' && gridX_0 >= 0n && gridX_0 <= 65535n)) {
      __compactRuntime.typeError('foldTripSample',
                                 'argument 2',
                                 'driveproof.compact line 62 char 1',
                                 'Uint<0..65536>',
                                 gridX_0)
    }
    if (!(typeof(gridY_0) === 'bigint' && gridY_0 >= 0n && gridY_0 <= 65535n)) {
      __compactRuntime.typeError('foldTripSample',
                                 'argument 3',
                                 'driveproof.compact line 62 char 1',
                                 'Uint<0..65536>',
                                 gridY_0)
    }
    if (!(typeof(speed_0) === 'bigint' && speed_0 >= 0n && speed_0 <= 65535n)) {
      __compactRuntime.typeError('foldTripSample',
                                 'argument 4',
                                 'driveproof.compact line 62 char 1',
                                 'Uint<0..65536>',
                                 speed_0)
    }
    if (!(typeof(braking_0) === 'bigint' && braking_0 >= 0n && braking_0 <= 255n)) {
      __compactRuntime.typeError('foldTripSample',
                                 'argument 5',
                                 'driveproof.compact line 62 char 1',
                                 'Uint<0..256>',
                                 braking_0)
    }
    if (!(typeof(timeBucket_0) === 'bigint' && timeBucket_0 >= 0n && timeBucket_0 <= 255n)) {
      __compactRuntime.typeError('foldTripSample',
                                 'argument 6',
                                 'driveproof.compact line 62 char 1',
                                 'Uint<0..256>',
                                 timeBucket_0)
    }
    return _dummyContract._foldTripSample_0(prev_0,
                                            gridX_0,
                                            gridY_0,
                                            speed_0,
                                            braking_0,
                                            timeBucket_0);
  },
  deriveTripCommitment: (...args_0) => {
    if (args_0.length !== 8) {
      throw new __compactRuntime.CompactError(`deriveTripCommitment: expected 8 arguments (as invoked from Typescript), received ${args_0.length}`);
    }
    const attestationId_0 = args_0[0];
    const driverBinding_0 = args_0[1];
    const salt_0 = args_0[2];
    const gridX_0 = args_0[3];
    const gridY_0 = args_0[4];
    const speed_0 = args_0[5];
    const braking_0 = args_0[6];
    const timeBucket_0 = args_0[7];
    if (!(typeof(attestationId_0) === 'bigint' && attestationId_0 >= 0 && attestationId_0 <= __compactRuntime.MAX_FIELD)) {
      __compactRuntime.typeError('deriveTripCommitment',
                                 'argument 1',
                                 'driveproof.compact line 80 char 1',
                                 'Field',
                                 attestationId_0)
    }
    if (!(typeof(driverBinding_0) === 'bigint' && driverBinding_0 >= 0 && driverBinding_0 <= __compactRuntime.MAX_FIELD)) {
      __compactRuntime.typeError('deriveTripCommitment',
                                 'argument 2',
                                 'driveproof.compact line 80 char 1',
                                 'Field',
                                 driverBinding_0)
    }
    if (!(typeof(salt_0) === 'bigint' && salt_0 >= 0 && salt_0 <= __compactRuntime.MAX_FIELD)) {
      __compactRuntime.typeError('deriveTripCommitment',
                                 'argument 3',
                                 'driveproof.compact line 80 char 1',
                                 'Field',
                                 salt_0)
    }
    if (!(Array.isArray(gridX_0) && gridX_0.length === 16 && gridX_0.every((t) => typeof(t) === 'bigint' && t >= 0n && t <= 65535n))) {
      __compactRuntime.typeError('deriveTripCommitment',
                                 'argument 4',
                                 'driveproof.compact line 80 char 1',
                                 'Vector<16, Uint<0..65536>>',
                                 gridX_0)
    }
    if (!(Array.isArray(gridY_0) && gridY_0.length === 16 && gridY_0.every((t) => typeof(t) === 'bigint' && t >= 0n && t <= 65535n))) {
      __compactRuntime.typeError('deriveTripCommitment',
                                 'argument 5',
                                 'driveproof.compact line 80 char 1',
                                 'Vector<16, Uint<0..65536>>',
                                 gridY_0)
    }
    if (!(Array.isArray(speed_0) && speed_0.length === 16 && speed_0.every((t) => typeof(t) === 'bigint' && t >= 0n && t <= 65535n))) {
      __compactRuntime.typeError('deriveTripCommitment',
                                 'argument 6',
                                 'driveproof.compact line 80 char 1',
                                 'Vector<16, Uint<0..65536>>',
                                 speed_0)
    }
    if (!(Array.isArray(braking_0) && braking_0.length === 16 && braking_0.every((t) => typeof(t) === 'bigint' && t >= 0n && t <= 255n))) {
      __compactRuntime.typeError('deriveTripCommitment',
                                 'argument 7',
                                 'driveproof.compact line 80 char 1',
                                 'Vector<16, Uint<0..256>>',
                                 braking_0)
    }
    if (!(Array.isArray(timeBucket_0) && timeBucket_0.length === 16 && timeBucket_0.every((t) => typeof(t) === 'bigint' && t >= 0n && t <= 255n))) {
      __compactRuntime.typeError('deriveTripCommitment',
                                 'argument 8',
                                 'driveproof.compact line 80 char 1',
                                 'Vector<16, Uint<0..256>>',
                                 timeBucket_0)
    }
    return _dummyContract._deriveTripCommitment_0(attestationId_0,
                                                  driverBinding_0,
                                                  salt_0,
                                                  gridX_0,
                                                  gridY_0,
                                                  speed_0,
                                                  braking_0,
                                                  timeBucket_0);
  },
  harshBrakingFlag: (...args_0) => {
    if (args_0.length !== 1) {
      throw new __compactRuntime.CompactError(`harshBrakingFlag: expected 1 argument (as invoked from Typescript), received ${args_0.length}`);
    }
    const braking_0 = args_0[0];
    if (!(typeof(braking_0) === 'bigint' && braking_0 >= 0n && braking_0 <= 255n)) {
      __compactRuntime.typeError('harshBrakingFlag',
                                 'argument 1',
                                 'driveproof.compact line 114 char 1',
                                 'Uint<0..256>',
                                 braking_0)
    }
    return _dummyContract._harshBrakingFlag_0(braking_0);
  },
  countHarshBraking: (...args_0) => {
    if (args_0.length !== 1) {
      throw new __compactRuntime.CompactError(`countHarshBraking: expected 1 argument (as invoked from Typescript), received ${args_0.length}`);
    }
    const braking_0 = args_0[0];
    if (!(Array.isArray(braking_0) && braking_0.length === 16 && braking_0.every((t) => typeof(t) === 'bigint' && t >= 0n && t <= 255n))) {
      __compactRuntime.typeError('countHarshBraking',
                                 'argument 1',
                                 'driveproof.compact line 118 char 1',
                                 'Vector<16, Uint<0..256>>',
                                 braking_0)
    }
    return _dummyContract._countHarshBraking_0(braking_0);
  },
  schnorrChallenge: (...args_0) => {
    if (args_0.length !== 5) {
      throw new __compactRuntime.CompactError(`schnorrChallenge: expected 5 arguments (as invoked from Typescript), received ${args_0.length}`);
    }
    const ann_x_0 = args_0[0];
    const ann_y_0 = args_0[1];
    const pk_x_0 = args_0[2];
    const pk_y_0 = args_0[3];
    const msg_0 = args_0[4];
    if (!(typeof(ann_x_0) === 'bigint' && ann_x_0 >= 0 && ann_x_0 <= __compactRuntime.MAX_FIELD)) {
      __compactRuntime.typeError('schnorrChallenge',
                                 'argument 1',
                                 'driveproof.compact line 184 char 1',
                                 'Field',
                                 ann_x_0)
    }
    if (!(typeof(ann_y_0) === 'bigint' && ann_y_0 >= 0 && ann_y_0 <= __compactRuntime.MAX_FIELD)) {
      __compactRuntime.typeError('schnorrChallenge',
                                 'argument 2',
                                 'driveproof.compact line 184 char 1',
                                 'Field',
                                 ann_y_0)
    }
    if (!(typeof(pk_x_0) === 'bigint' && pk_x_0 >= 0 && pk_x_0 <= __compactRuntime.MAX_FIELD)) {
      __compactRuntime.typeError('schnorrChallenge',
                                 'argument 3',
                                 'driveproof.compact line 184 char 1',
                                 'Field',
                                 pk_x_0)
    }
    if (!(typeof(pk_y_0) === 'bigint' && pk_y_0 >= 0 && pk_y_0 <= __compactRuntime.MAX_FIELD)) {
      __compactRuntime.typeError('schnorrChallenge',
                                 'argument 4',
                                 'driveproof.compact line 184 char 1',
                                 'Field',
                                 pk_y_0)
    }
    if (!(Array.isArray(msg_0) && msg_0.length === 1 && msg_0.every((t) => typeof(t) === 'bigint' && t >= 0 && t <= __compactRuntime.MAX_FIELD))) {
      __compactRuntime.typeError('schnorrChallenge',
                                 'argument 5',
                                 'driveproof.compact line 184 char 1',
                                 'Vector<1, Field>',
                                 msg_0)
    }
    return _dummyContract._schnorrChallenge_0(ann_x_0,
                                              ann_y_0,
                                              pk_x_0,
                                              pk_y_0,
                                              msg_0);
  }
};
export const contractReferenceLocations =
  { tag: 'publicLedgerArray', indices: { } };
//# sourceMappingURL=index.js.map
