"use strict";

const {Lexer} = require("../../lib/expression/lexer");

describe("lexer", () => {
  describe("CallExpression", () => {
    it("has start and end parantheses", () => {
      const lexer = Lexer("$time()");
      expect(lexer.get()).to.deep.include({
        type: "CallExpression",
        cargo: "time",
      });
      expect(lexer.get()).to.deep.include({
        type: ")",
        cargo: ")",
      });
    });

    it("throws SyntaxError if not followed by start parantheses", () => {
      const lexer = Lexer("$time");
      expect(() => {
        lexer.get();
      }).to.throw(SyntaxError, "Unexpected end of line");
    });

    it("throws SyntaxError if unexpected other char after identifier", () => {
      const lexer = Lexer("$time)");
      expect(() => {
        lexer.get();
      }).to.throw(SyntaxError, "Unexpected char ) at 0:5");
    });
  });

  describe("Identifier", () => {
    it("consumes both start and end parantheses", () => {
      const lexer = Lexer("$(myVar)");
      expect(lexer.get()).to.deep.include({
        type: "Identifier",
        cargo: "myVar",
      });
      expect(lexer.get()).to.deep.include({
        type: "EOL",
      });
    });

    it("throws SyntaxError if not followed by start parantheses", () => {
      const lexer = Lexer("$(myVar");
      expect(() => {
        lexer.get();
      }).to.throw(SyntaxError, "Unexpected end of line");
    });

    it("throws SyntaxError if unexpected other char after identifier", () => {
      const lexer = Lexer("$(myVar(");
      expect(() => {
        lexer.get();
      }).to.throw(SyntaxError, "Unexpected char ( at 0:7");
    });
  });

  describe("ObjectExpression", () => {
    it("consumes both start and end curly brace", () => {
      const lexer = Lexer("{'myProp': 1}");
      expect(lexer.get()).to.deep.include({
        type: "ObjectExpression",
        cargo: "{",
      });
      expect(lexer.get()).to.include({
        type: "Literal",
        cargo: "myProp",
      });
      expect(lexer.get()).to.include({
        type: ":",
        cargo: ":",
      });
      expect(lexer.get()).to.include({
        type: "Space",
        cargo: " ",
      });
      expect(lexer.get()).to.include({
        type: "Number",
        cargo: "1",
      });
      expect(lexer.get()).to.include({
        type: "}",
        cargo: "}",
      });
    });
  });

  describe("source map", () => {
    it("token keeps start source for empty call expression", () => {
      const lexer = Lexer("$time()", true);
      expect(lexer.get()).to.deep.include({
        type: "CallExpression",
        cargo: "time",
        raw: "$time("
      });
    });

    it("returns end source for empty call expression", () => {
      const lexer = Lexer("$time()", true);
      expect(lexer.get()).to.have.property("type", "CallExpression");
      expect(lexer.get()).to.deep.include({
        type: ")",
        raw: ")"
      });
    });

    it("returns source for call expression with arguments", () => {
      const lexer = Lexer("$add_header('x-test-lexer', 'true')", true);
      expect(lexer.get()).to.have.property("type", "CallExpression");
      expect(lexer.get()).to.deep.include({
        type: "Literal",
        cargo: "x-test-lexer",
        raw: "'x-test-lexer'",
      });
      expect(lexer.get()).to.deep.include({
        type: ",",
        cargo: ",",
        raw: ",",
      });
      expect(lexer.get()).to.deep.include({
        type: "Literal",
        cargo: "true",
        raw: " 'true'",
      });
    });

    it("returns source for identifier", () => {
      const lexer = Lexer("$(myVar)", true);
      expect(lexer.get()).to.deep.include({
        type: "Identifier",
        cargo: "myVar",
        raw: "$(myVar)"
      });
    });

    it("returns source for member expression", () => {
      const lexer = Lexer("$(myVar{'myProp'})", true);
      expect(lexer.get()).to.deep.include({
        type: "MemberExpression",
        cargo: "myVar",
        raw: "$(myVar{"
      });
      expect(lexer.get()).to.deep.include({
        type: "Literal",
        cargo: "myProp",
        raw: "'myProp'"
      });
      expect(lexer.get()).to.deep.include({
        type: "}",
        cargo: "}",
        raw: "}"
      });
      expect(lexer.get()).to.deep.include({
        type: ")",
        cargo: ")",
        raw: ")"
      });
    });

    it("returns source for literal string", () => {
      const lexer = Lexer("'myValue'", true);
      expect(lexer.get()).to.deep.include({
        type: "Literal",
        cargo: "myValue",
        raw: "'myValue'"
      });
    });

    it("returns source for literal escaped string", () => {
      const lexer = Lexer("'''myValue'''", true);
      expect(lexer.get()).to.deep.include({
        type: "Literal",
        cargo: "myValue",
        raw: "'''myValue'''"
      });
    });

    it("returns source for literal number", () => {
      const lexer = Lexer("99", true);
      expect(lexer.get()).to.deep.include({
        type: "Number",
        cargo: "99",
        raw: "99"
      });
    });

    it("returns source for empty array", () => {
      const lexer = Lexer("[]", true);
      expect(lexer.get()).to.deep.include({
        type: "ArrayExpression",
        cargo: "[",
        raw: "["
      });

      expect(lexer.get()).to.deep.include({
        type: "]",
        cargo: "]",
        raw: "]"
      });
    });

    it("returns source for array with numbers", () => {
      const lexer = Lexer("[1, 2]", true);
      expect(lexer.get()).to.deep.include({
        type: "ArrayExpression",
        cargo: "[",
        raw: "["
      });

      expect(lexer.get()).to.deep.include({
        type: "Number",
        cargo: "1",
        raw: "1"
      });

      expect(lexer.get()).to.deep.include({
        type: ",",
        cargo: ",",
        raw: ","
      });

      expect(lexer.get()).to.deep.include({
        type: "Number",
        cargo: "2",
        raw: " 2"
      });

      expect(lexer.get()).to.deep.include({
        type: "]",
        cargo: "]",
        raw: "]"
      });
    });

    it("returns source for array with literals", () => {
      const lexer = Lexer("['a', '''b''']", true);
      expect(lexer.get()).to.deep.include({
        type: "ArrayExpression",
        cargo: "[",
        raw: "["
      });

      expect(lexer.get()).to.deep.include({
        type: "Literal",
        raw: "'a'"
      });

      expect(lexer.get()).to.deep.include({
        type: ",",
        cargo: ",",
        raw: ","
      });

      expect(lexer.get()).to.deep.include({
        type: "Literal",
        raw: " '''b'''"
      });

      expect(lexer.get()).to.deep.include({
        type: "]",
        raw: "]"
      });
    });
  });
});
