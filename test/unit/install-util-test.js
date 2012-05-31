/*!
 * ENDER - The open module JavaScript framework
 *
 * Copyright (c) 2011-2012 @ded, @fat, @rvagg and other contributors
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is furnished
 * to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */


var buster = require('buster')
  , path = require('path')
  , assert = buster.assert
  , DependencyTree = require('../../lib/dependency-tree.js')
  , installUtil = require('../../lib/install-util')
  , packageUtil = require('../../lib/package-util')

buster.testCase('Install util', {
    'findMissingDependencies': {
        'test no dependencies': function () {
          var originalTree = DependencyTree.create({}, {
                  'pkg1': { dependencies: {}, parents: [ 'foo' ] }
                , 'some/path/to/pkg2': { dependencies: {}, parents: [ 'foo', 'bar' ] }
              })
            , expected     = []
            , actual       = installUtil.findMissingDependencies(originalTree.allRootPackages(), originalTree)

          assert.equals(actual, expected)
        }

      , 'simple dependencies (no missing)': function () {
          var originalTree = DependencyTree.create({}, {
                  'apkg-2': {
                      parents: []
                    , dependencies: {
                          'mypkg-1': {
                              parents: [ 'apkg-2' ]
                            , dependencies: {}
                          }
                      }
                  }
                , 'somepkg-5': {
                      parents: []
                    , dependencies: {
                          'foo-4': {
                              parents: [ 'somepkg-5' ]
                            , dependencies: {
                                'bar-3': {
                                    parents: [ 'somepkg-5', 'foo-4' ]
                                  , dependencies: {}
                                }
                              }
                          }
                      }
                  }
                , 'apkg-7': {
                      parents: []
                    , dependencies: {
                          'mypkg-6': {
                              parents: [ 'apkg-7' ]
                            , dependencies: {}
                          }
                      }
                  }
              })
            , expected     = []
            , actual       = installUtil.findMissingDependencies(originalTree.allRootPackages(), originalTree)

          assert.equals(actual, expected)
        }

      , 'simple dependencies (with missing)': {
            'setUp': function () {
              this.originalTree = DependencyTree.create({}, {
                  'apkg-2': {
                      parents: []
                    , dependencies: {
                          'mypkg-1': {
                              parents: [ 'apkg-2' ]
                            , dependencies: {
                                  'memissing': 'missing'
                              }
                          }
                      }
                  }
                , 'somepkg-5': {
                      parents: []
                    , dependencies: {
                          'foo-4': {
                              parents: [ 'somepkg-5' ]
                            , dependencies: {
                                  'bar-3': {
                                      parents: [ 'somepkg-5', 'foo-4' ]
                                    , dependencies: {}
                                  }
                                , 'argh': 'missing'
                              }
                          }
                      }
                  }
                , 'apkg-7': {
                      parents: []
                    , dependencies: {
                          'mypkg-6': {
                              parents: [ 'apkg-7' ]
                            , dependencies: {}
                          }
                      }
                  }
              })
            }

          , 'all root packages': function () {
              var expected     = [ 'memissing', 'argh' ]
                , actual       = installUtil.findMissingDependencies(this.originalTree.allRootPackages(), this.originalTree)

              assert.equals(actual, expected)
            }

          , 'not all root packages': function () {
              var expected     = [ 'memissing' ]
                , actual       = installUtil.findMissingDependencies([ 'apkg-2', 'apkg-7' ], this.originalTree)

              assert.equals(actual, expected)
            }

          , 'only complete root package': function () {
              var expected     = [ ]
                , actual       = installUtil.findMissingDependencies([ 'apkg-7' ], this.originalTree)

              assert.equals(actual, expected)
            }
        }

      , 'missing deps exist in other branches': {
            'setUp': function () {
              this.originalTree = DependencyTree.create({}, {
                  'mypkg-1': 'missing'
                , 'apkg-2': {
                      parents: []
                    , dependencies: {
                          'mypkg-1': {
                              parents: [ 'apkg-2' ]
                            , dependencies: {
                                  'memissing': 'missing'
                              }
                          }
                      }
                  }
                , 'somepkg-5': {
                      parents: []
                    , dependencies: {
                          'mypkg-6': 'missing'
                        , 'foo-4': {
                              parents: [ 'somepkg-5' ]
                            , dependencies: {
                                  'bar-3': {
                                      parents: [ 'somepkg-5', 'foo-4' ]
                                    , dependencies: {}
                                  }
                                , 'argh': 'missing'
                              }
                          }
                      }
                  }
                , 'apkg-7': {
                      parents: []
                    , dependencies: {
                          'mypkg-6': {
                              parents: [ 'apkg-7' ]
                            , dependencies: {}
                          }
                        , 'apkg-2': 'missing'
                      }
                  }
              })
            }

          , 'all root packages': function () {
              var expected     = [ 'memissing', 'argh' ]
                , actual       = installUtil.findMissingDependencies(this.originalTree.allRootPackages(), this.originalTree)

              assert.equals(actual, expected)
            }

          , 'not all root packages': function () {
              var expected     = [ 'memissing' ]
                , actual       = installUtil.findMissingDependencies([ 'apkg-2', 'apkg-7' ], this.originalTree)

              assert.equals(actual, expected)
            }

          , 'single root package': function () {
              // we're testing the ability to reach across the tree to find missing deps
              var expected     = []
                , actual       = installUtil.findMissingDependencies([ 'apkg-7' ], this.originalTree)

              assert.equals(actual, expected)
            }
        }
    }

  , 'findPathDependencies': function () {
        var originalTree = DependencyTree.create({}, {
                'apkg-2': {
                    parents: []
                  , dependencies: {
                        './mypkg-1': {
                            parents: [ 'apkg-2' ]
                          , dependencies: {}
                        }
                    }
                }
              , '/somepkg-5': {
                    parents: []
                  , packageJSON: { name: 'dontlocalizeme' }
                  , dependencies: {
                        'foo-4': {
                            parents: [ 'somepkg-5' ]
                          , dependencies: {
                              '../../bar-3': {
                                  parents: [ 'somepkg-5', 'foo-4' ]
                                , dependencies: {}
                              }
                            }
                        }
                    }
                }
              , 'apkg-7': {
                    parents: []
                  , dependencies: {
                        'mypkg-6': {
                            parents: [ 'apkg-7' ]
                          , dependencies: {}
                        }
                    }
                }
              , 'dontlocalizeme': {}
            })
          , expected     = [ './mypkg-1', '/somepkg-5', '../../bar-3' ]
          , actual       = installUtil.findPathDependencies([ 'apkg-2', '/somepkg-5', 'apkg-7' ], originalTree)

        assert.equals(actual.length, expected.length)
        expected.forEach(function (e) { assert(actual.indexOf(e) > -1) })
      }

    , 'filterPackagesWithoutCwd': {
          '.': function () {
            assert.equals(installUtil.filterPackagesWithoutCwd([ 'foo', '.', 'bar' ]), [ 'foo', 'bar' ])
          }

        , 'foo/..': function () {
            assert.equals(installUtil.filterPackagesWithoutCwd([ 'foo', 'foo/..', 'bar' ]), [ 'foo', 'bar' ])
          }

        , 'absolute path': function () {
            assert.equals(installUtil.filterPackagesWithoutCwd([ 'foo', path.resolve('.'), 'bar' ]), [ 'foo', 'bar' ])
          }
      }
})