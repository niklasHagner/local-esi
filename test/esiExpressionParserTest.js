"use strict";

const esiExpressionParser = require("../lib/esiExpressionParser");

describe("esiExpressionParser", () => {

  it("handle binary expression with identifier on left side and literal on right", () => {
    const input = "$(access_granted)=='true'";
    const result = esiExpressionParser(input);
    expect(result).to.have.property("type", "BinaryExpression");
    expect(result).to.have.property("operator", "==");
    expect(result).to.have.property("left");
    expect(result.left).to.have.property("type", "Identifier");
    expect(result.left).to.have.property("name", "access_granted");
    expect(result).to.have.property("right");
    expect(result.right).to.have.property("type", "Literal");
    expect(result.right).to.have.property("value", "true");
  });

  it("handle call expression", () => {
    const input = "$exists($(user_email))";
    const result = esiExpressionParser(input);

    expect(result).to.have.property("type", "CallExpression");
    expect(result).to.have.property("callee").that.eql({
      type: "Identifier",
      name: "exists"
    });
    expect(result).to.have.property("arguments").to.eql([{
      type: "Identifier",
      name: "user_email"
    }]);
  });

  it("should handle unary expression with ! operator", () => {
    const input = "!$exists($(HTTP_COOKIE{'remember_me'}))";
    const result = esiExpressionParser(input);

    expect(result).to.have.property("type", "UnaryExpression");
    expect(result).to.have.property("operator", "!");
    expect(result).to.have.property("prefix", true);
    expect(result).to.have.property("argument").to.eql({
      type: "CallExpression",
      callee: {
        type: "Identifier",
        name: "exists"
      },
      arguments: [{
        type: "MemberExpression",
        object: {
          type: "Identifier",
          name: "HTTP_COOKIE"
        },
        property: {
          type: "Identifier",
          name: "remember_me"
        }
      }]
    });
  });

  it("should handle member expression", () => {
    const input = "$(HTTP_COOKIE{'remember_me'})";
    const result = esiExpressionParser(input);

    expect(result).to.have.property("type", "MemberExpression");
    expect(result).to.have.property("object").that.eql({
      type: "Identifier",
      name: "HTTP_COOKIE"
    });

    expect(result).to.have.property("property").that.eql({
      type: "Identifier",
      name: "remember_me"
    });
  });

  it("handle logical expression with & operator ", () => {
    const input = "$(HTTP_USER_AGENT{'os'})=='WIN' & $(HTTP_USER_AGENT{'browser'})=='MSIE')";
    const result = esiExpressionParser(input);

    expect(result).to.have.property("type", "LogicalExpression");
    expect(result).to.have.property("operator", "&");
    expect(result).to.have.property("left").that.eql({
      type: "BinaryExpression",
      operator: "==",
      left: {
        type: "MemberExpression",
        object: {
          type: "Identifier",
          name: "HTTP_USER_AGENT"
        },
        property: {
          type: "Identifier",
          name: "os"
        }
      },
      right: {
        type: "Literal",
        value: "WIN"
      }
    });
    expect(result).to.have.property("right").that.eql({
      type: "BinaryExpression",
      operator: "==",
      left: {
        type: "MemberExpression",
        object: {
          type: "Identifier",
          name: "HTTP_USER_AGENT"
        },
        property: {
          type: "Identifier",
          name: "browser"
        }
      },
      right: {
        type: "Literal",
        value: "MSIE"
      }
    });
  });

  it("should logical binary expression with call expressions", () => {
    const input = "$exists($(HTTP_COOKIE{'remember_me'})) | $exists($(HTTP_COOKIE{'accessToken'}))";
    const result = esiExpressionParser(input);

    expect(result).to.have.property("type", "LogicalExpression");
    expect(result).to.have.property("operator", "|");
    expect(result).to.have.property("left").that.eql({
      type: "CallExpression",
      callee: {
        type: "Identifier",
        name: "exists"
      },
      arguments: [{
        type: "MemberExpression",
        object: {
          type: "Identifier",
          name: "HTTP_COOKIE"
        },
        property: {
          type: "Identifier",
          name: "remember_me"
        }
      }]
    });
    expect(result).to.have.property("right").that.eql({
      type: "CallExpression",
      callee: {
        type: "Identifier",
        name: "exists"
      },
      arguments: [{
        type: "MemberExpression",
        object: {
          type: "Identifier",
          name: "HTTP_COOKIE"
        },
        property: {
          type: "Identifier",
          name: "accessToken"
        }
      }]
    });
  });

  it("handle logical expression where left is a unary expression", () => {
    const input = "!$exists($(HTTP_COOKIE{'remember_me'})) | $exists($(HTTP_COOKIE{'accessToken'}))";
    const result = esiExpressionParser(input);
    expect(result).to.have.property("type", "LogicalExpression");
    expect(result).to.have.property("operator", "|");
    expect(result).to.have.property("left").that.eql({
      type: "UnaryExpression",
      operator: "!",
      prefix: true,
      argument: {
        type: "CallExpression",
        callee: {
          type: "Identifier",
          name: "exists"
        },
        arguments: [{
          type: "MemberExpression",
          object: {
            type: "Identifier",
            name: "HTTP_COOKIE"
          },
          property: {
            type: "Identifier",
            name: "remember_me"
          }
        }]
      }
    });
    expect(result).to.have.property("right").that.eql({
      type: "CallExpression",
      callee: {
        type: "Identifier",
        name: "exists"
      },
      arguments: [{
        type: "MemberExpression",
        object: {
          type: "Identifier",
          name: "HTTP_COOKIE"
        },
        property: {
          type: "Identifier",
          name: "accessToken"
        }
      }]
    });
  });

  it("handle multiple ors", () => {
    const input = "$exists($(HTTP_COOKIE{'remember_me'})) | $exists($(HTTP_COOKIE{'accessToken'})) | $exists($(HTTP_COOKIE{'sessionKey'}))";
    const result = esiExpressionParser(input);

    expect(result).to.have.property("type", "LogicalExpression");
    expect(result).to.have.property("operator", "|");
    expect(result).to.have.property("left").that.eql({
      type: "CallExpression",
      callee: {
        type: "Identifier",
        name: "exists"
      },
      arguments: [{
        type: "MemberExpression",
        object: {
          type: "Identifier",
          name: "HTTP_COOKIE"
        },
        property: {
          type: "Identifier",
          name: "remember_me"
        }
      }]
    });
    expect(result).to.have.property("right").that.eql({
      type: "LogicalExpression",
      operator: "|",
      left: {
        type: "CallExpression",
        callee: {
          type: "Identifier",
          name: "exists"
        },
        arguments: [{
          type: "MemberExpression",
          object: {
            type: "Identifier",
            name: "HTTP_COOKIE"
          },
          property: {
            type: "Identifier",
            name: "accessToken"
          }
        }]
      },
      right: {
        type: "CallExpression",
        callee: {
          type: "Identifier",
          name: "exists"
        },
        arguments: [{
          type: "MemberExpression",
          object: {
            type: "Identifier",
            name: "HTTP_COOKIE"
          },
          property: {
            type: "Identifier",
            name: "sessionKey"
          }
        }]
      }
    });
  });

  it("handles logical expression with && operator", () => {
    const input = "$(someVar) == 'a' && $(someVar2) == 'b'";
    const result = esiExpressionParser(input);

    expect(result).to.have.property("type", "LogicalExpression");
    expect(result).to.have.property("left").that.eql({
      type: "BinaryExpression",
      left: {
        type: "Identifier",
        name: "someVar"
      },
      operator: "==",
      right: {
        type: "Literal",
        value: "a"
      }
    });
    expect(result).to.have.property("operator").that.eql("&&");
    expect(result).to.have.property("right").that.eql({
      type: "BinaryExpression",
      left: {
        type: "Identifier",
        name: "someVar2"
      },
      operator: "==",
      right: {
        type: "Literal",
        value: "b"
      }
    });
  });

  it("handles binary expression with number literal", () => {
    const input = "$(someVar) == 59";
    const result = esiExpressionParser(input);

    expect(result).to.have.property("type", "BinaryExpression");
    expect(result).to.have.property("left").that.eql({
      type: "Identifier",
      name: "someVar"
    });
    expect(result).to.have.property("operator").that.eql("==");
    expect(result).to.have.property("right").that.eql({
      type: "Literal",
      value: 59
    });
  });

  it("handles binary expression with negative number literal", () => {
    const input = "$(someVar) == -1";
    const result = esiExpressionParser(input);

    expect(result).to.have.property("type", "BinaryExpression");
    expect(result).to.have.property("left").that.eql({
      type: "Identifier",
      name: "someVar"
    });
    expect(result).to.have.property("operator").that.eql("==");
    expect(result).to.have.property("right").that.eql({
      type: "Literal",
      value: -1
    });
  });

  it("handles binary expression with >= operator", () => {
    const input = "$(someVar) >= 59";
    const result = esiExpressionParser(input);

    expect(result).to.have.property("type", "BinaryExpression");
    expect(result).to.have.property("left").that.eql({
      type: "Identifier",
      name: "someVar"
    });
    expect(result).to.have.property("operator").that.eql(">=");
    expect(result).to.have.property("right").that.eql({
      type: "Literal",
      value: 59
    });
  });

  it("handles binary expression with <= operator", () => {
    const input = "$(someVar) <= 590";
    const result = esiExpressionParser(input);

    expect(result).to.have.property("type", "BinaryExpression");
    expect(result).to.have.property("left").that.eql({
      type: "Identifier",
      name: "someVar"
    });
    expect(result).to.have.property("operator").that.eql("<=");
    expect(result).to.have.property("right").that.eql({
      type: "Literal",
      value: 590
    });
  });

  it("handles binary expression enclosed in unnecessary parentheses", () => {
    const input = "($(someVar) <= 590)";
    const result = esiExpressionParser(input);

    expect(result).to.have.property("type", "BinaryExpression");
    expect(result).to.have.property("left").that.eql({
      type: "Identifier",
      name: "someVar"
    });
    expect(result).to.have.property("operator").that.eql("<=");
    expect(result).to.have.property("right").that.eql({
      type: "Literal",
      value: 590
    });
  });

  it("handles binary expression where each expression is enclosed in unnecessary parentheses", () => {
    const input = "($(someVar)) <= (590)";
    const result = esiExpressionParser(input);

    expect(result).to.have.property("type", "BinaryExpression");
    expect(result).to.have.property("left").that.eql({
      type: "Identifier",
      name: "someVar"
    });
    expect(result).to.have.property("operator").that.eql("<=");
    expect(result).to.have.property("right").that.eql({
      type: "Literal",
      value: 590
    });
  });

  it("1handles binary expression where each expression is enclosed in unnecessary parentheses", () => {
    const input = "($(someVar) == 1) && ($(someVar) == 2)";
    const result = esiExpressionParser(input);

    expect(result).to.have.property("type", "LogicalExpression");
    expect(result).to.have.property("left").that.eql({
      type: "BinaryExpression",
      left: {
        type: "Identifier",
        name: "someVar"
      },
      operator: "==",
      right: {
        type: "Literal",
        value: 1
      }
    });
    expect(result).to.have.property("operator").that.eql("&&");
    expect(result).to.have.property("right").that.eql({
      type: "BinaryExpression",
      left: {
        type: "Identifier",
        name: "someVar"
      },
      operator: "==",
      right: {
        type: "Literal",
        value: 2
      }
    });
  });
});
