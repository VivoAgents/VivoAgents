# -*- coding: utf-8 -*-
# Generated by the protocol buffer compiler.  DO NOT EDIT!
# source: serialization_test.proto
# Protobuf Python Version: 4.25.1
"""Generated protocol buffer code."""
from google.protobuf import descriptor as _descriptor
from google.protobuf import descriptor_pool as _descriptor_pool
from google.protobuf import symbol_database as _symbol_database
from google.protobuf.internal import builder as _builder
# @@protoc_insertion_point(imports)

_sym_db = _symbol_database.Default()




DESCRIPTOR = _descriptor_pool.Default().AddSerializedFile(b'\n\x18serialization_test.proto\x12\x06\x61gents\"\x1f\n\x0cProtoMessage\x12\x0f\n\x07message\x18\x01 \x01(\t\"L\n\x13NestingProtoMessage\x12\x0f\n\x07message\x18\x01 \x01(\t\x12$\n\x06nested\x18\x02 \x01(\x0b\x32\x14.agents.ProtoMessageb\x06proto3')

_globals = globals()
_builder.BuildMessageAndEnumDescriptors(DESCRIPTOR, _globals)
_builder.BuildTopDescriptorsAndMessages(DESCRIPTOR, 'serialization_test_pb2', _globals)
if _descriptor._USE_C_DESCRIPTORS == False:
  DESCRIPTOR._options = None
  _globals['_PROTOMESSAGE']._serialized_start=36
  _globals['_PROTOMESSAGE']._serialized_end=67
  _globals['_NESTINGPROTOMESSAGE']._serialized_start=69
  _globals['_NESTINGPROTOMESSAGE']._serialized_end=145
# @@protoc_insertion_point(module_scope)
