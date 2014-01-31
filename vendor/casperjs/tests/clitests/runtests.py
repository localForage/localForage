#!/usr/bin/env python

import json
import os
import signal
import subprocess
import unittest

TEST_ROOT = os.path.abspath(os.path.dirname(__file__))
CASPERJS_ROOT = os.path.abspath(os.path.join(TEST_ROOT, '..', '..'))
CASPER_EXEC = os.path.join(CASPERJS_ROOT, 'bin', 'casperjs')
ENGINE_EXEC = os.environ.get('ENGINE_EXECUTABLE',
                             os.environ.get('PHANTOMJS_EXECUTABLE',
                                            "phantomjs"))
# make it to an absolute path, because some test change the working directory
# and relative path to phantomjs would be invalid
if not os.path.isabs(ENGINE_EXEC):
    os.environ['ENGINE_EXECUTABLE'] = os.path.join(CASPERJS_ROOT, ENGINE_EXEC)

class TimeoutException(Exception):
    pass


def timeout(timeout_time):
    def timeout_function(f):
        def f2(*args):
            def timeout_handler(signum, frame):
                raise TimeoutException()
            old_handler = signal.signal(signal.SIGALRM, timeout_handler)
            signal.alarm(timeout_time) # triger alarm in timeout_time seconds
            try:
                retval = f(*args)
            except TimeoutException:
                raise AssertionError('timeout of %ds. exhausted' % timeout_time)
            finally:
                signal.signal(signal.SIGALRM, old_handler)
            signal.alarm(0)
            return retval
        return f2
    return timeout_function


class CasperExecTestBase(unittest.TestCase):
    def setUp(self):
        with open(os.path.join(CASPERJS_ROOT, 'package.json')) as f:
            self.pkg_version = json.load(f).get('version')

    def runCommand(self, cmd, **kwargs):
        failing = kwargs.get('failing', False)
        cmd_args = [CASPER_EXEC, '--no-colors'] + cmd.split(' ')
        try:
            return subprocess.check_output(cmd_args).strip().decode('utf-8')
            if failing:
                raise AssertionError('Command %s has not failed' % cmd)
        except subprocess.CalledProcessError as err:
            if failing:
                return err.output.decode('utf-8')
            raise IOError('Command %s exited: %s \n %s'
                          % (cmd, err, err.output.decode('utf-8')))

    def assertCommandOutputEquals(self, cmd, result, **kwargs):
        self.assertEqual(self.runCommand(cmd), result)

    def assertCommandOutputContains(self, cmd, what, **kwargs):
        if not what:
            raise AssertionError('Empty lookup')
        if isinstance(what, (list, tuple)):
            output = self.runCommand(cmd, **kwargs)
            for entry in what:
                self.assertIn(entry, output)
        else:
            self.assertIn(what, self.runCommand(cmd))


class BasicCommandsTest(CasperExecTestBase):
    @timeout(20)
    def test_version(self):
        self.assertCommandOutputEquals('--version', self.pkg_version)

    @timeout(20)
    def test_help(self):
        self.assertCommandOutputContains('--help', self.pkg_version)


class RequireScriptFullPathTest(CasperExecTestBase):
    @timeout(20)
    def test_simple_require(self):
        script_path = os.path.join(TEST_ROOT, 'modules', 'test.js')
        self.assertCommandOutputEquals(script_path, 'hello, world')

    @timeout(20)
    def test_require_coffee(self):
        script_path = os.path.join(TEST_ROOT, 'modules', 'test_coffee.js')
        self.assertCommandOutputEquals(script_path, '42')

    @timeout(20)
    def test_node_module_require(self):
        script_path = os.path.join(TEST_ROOT, 'modules', 'test_node_mod.js')
        self.assertCommandOutputEquals(script_path, '42')

    @timeout(20)
    def test_node_module_require_index(self):
        script_path = os.path.join(
            TEST_ROOT, 'modules', 'test_node_mod_index.js')
        self.assertCommandOutputEquals(script_path, '42')

    @timeout(20)
    def test_node_module_require_json_package(self):
        script_path = os.path.join(
            TEST_ROOT, 'modules', 'test_node_mod_json_package.js')
        self.assertCommandOutputEquals(script_path, '42')

    @timeout(20)
    def test_node_module_require_json(self):
        script_path = os.path.join(TEST_ROOT, 'modules', 'test_node_json.js')
        self.assertCommandOutputEquals(script_path, '42')


class RequireWithOnlyScriptNameTest(CasperExecTestBase):

    def setUp(self):
        self.currentPath = os.getcwd()
        os.chdir(os.path.join(TEST_ROOT, 'modules'))
        super(RequireWithOnlyScriptNameTest, self).setUp()

    def tearDown(self):
        os.chdir(self.currentPath)
        super(RequireWithOnlyScriptNameTest, self).tearDown()

    @timeout(20)
    def test_simple_require(self):
        self.assertCommandOutputEquals('test.js', 'hello, world')

    @timeout(20)
    def test_simple_patched_require(self):
        self.assertCommandOutputEquals(
            'test_patched_require.js', 'hello, world')

    @timeout(20)
    def test_require_coffee(self):
        self.assertCommandOutputEquals('test_coffee.js', '42')

    @timeout(20)
    def test_node_module_require(self):
        self.assertCommandOutputEquals('test_node_mod.js', '42')

    @timeout(20)
    def test_node_module_require_index(self):
        self.assertCommandOutputEquals('test_node_mod_index.js', '42')

    @timeout(20)
    def test_node_module_require_json_package(self):
        self.assertCommandOutputEquals('test_node_mod_json_package.js', '42')

    @timeout(20)
    def test_node_module_require_json(self):
        self.assertCommandOutputEquals('test_node_json.js', '42')


class RequireWithRelativeScriptPathTest(CasperExecTestBase):
    def setUp(self):
        self.currentPath = os.getcwd()
        os.chdir(os.path.join(TEST_ROOT, 'modules'))
        super(RequireWithRelativeScriptPathTest, self).setUp()

    def tearDown(self):
        os.chdir(self.currentPath)
        super(RequireWithRelativeScriptPathTest, self).tearDown()

    @timeout(20)
    def test_simple_require(self):
        self.assertCommandOutputEquals('./test.js', 'hello, world')

    @timeout(20)
    def test_simple_patched_require(self):
        self.assertCommandOutputEquals(
            'test_patched_require.js', 'hello, world')

    @timeout(20)
    def test_require_coffee(self):
        self.assertCommandOutputEquals('./test_coffee.js', '42')

    @timeout(20)
    def test_node_module_require(self):
        self.assertCommandOutputEquals('./test_node_mod.js', '42')

    @timeout(20)
    def test_node_module_require_index(self):
        self.assertCommandOutputEquals('./test_node_mod_index.js', '42')

    @timeout(20)
    def test_node_module_require_json_package(self):
        self.assertCommandOutputEquals('./test_node_mod_json_package.js', '42')

    @timeout(20)
    def test_node_module_require_json(self):
        self.assertCommandOutputEquals('./test_node_json.js', '42')


class ScriptOutputTest(CasperExecTestBase):
    @timeout(20)
    def test_simple_script(self):
        script_path = os.path.join(TEST_ROOT, 'scripts', 'script.js')
        self.assertCommandOutputEquals(script_path, 'it works')


class ScriptErrorTest(CasperExecTestBase):
    @timeout(20)
    def test_syntax_error(self):
        script_path = os.path.join(TEST_ROOT, 'error', 'syntax.js')
        self.assertCommandOutputContains(script_path, [
            'SyntaxError: Parse error',
        ], failing=True)

    @timeout(20)
    def test_syntax_error_in_test(self):
        script_path = os.path.join(TEST_ROOT, 'error', 'syntax.js')
        self.assertCommandOutputContains('test %s' % script_path, [
            'SyntaxError: Parse error',
        ], failing=True)


class TestCommandOutputTest(CasperExecTestBase):
    @timeout(20)
    def test_simple_test_script(self):
        script_path = os.path.join(TEST_ROOT, 'tester', 'mytest.js')
        self.assertCommandOutputContains('test ' + script_path, [
            script_path,
            'PASS ok1',
            'PASS ok2',
            'PASS ok3',
            '3 tests executed',
            '3 passed',
            '0 failed',
            '0 dubious',
            '0 skipped',
        ])

    @timeout(20)
    def test_new_style_test(self):
        # using begin()
        script_path = os.path.join(TEST_ROOT, 'tester', 'passing.js')
        self.assertCommandOutputContains('test ' + script_path, [
            script_path,
            '# true',
            'PASS Subject is strictly true',
            'PASS 1 test executed',
            '1 passed',
            '0 failed',
            '0 dubious',
            '0 skipped',
        ])

    @timeout(20)
    def test_new_failing_test(self):
        # using begin()
        script_path = os.path.join(TEST_ROOT, 'tester', 'failing.js')
        self.assertCommandOutputContains('test ' + script_path, [
            script_path,
            '# true',
            'FAIL Subject is strictly true',
            '#    type: assert',
            '#    file: %s:3' % script_path,
            '#    code: test.assert(false);',
            '#    subject: false',
            'FAIL 1 test executed',
            '0 passed',
            '1 failed',
            '0 dubious',
            '0 skipped',
        ], failing=True)

    @timeout(20)
    def test_step_throwing_test(self):
        # using begin()
        script_path = os.path.join(TEST_ROOT, 'tester', 'step_throws.js')
        self.assertCommandOutputContains('test ' + script_path, [
            script_path,
            '# step throws',
            'FAIL Error: oops!',
            '#    type: uncaughtError',
            '#    file: %s:5' % script_path,
            '#    error: oops!',
            'FAIL 1 test executed',
            '0 passed',
            '1 failed',
            '0 dubious',
            '0 skipped',
        ], failing=True)

    @timeout(20)
    def test_waitFor_timeout(self):
        # using begin()
        script_path = os.path.join(TEST_ROOT, 'tester', 'waitFor_timeout.js')
        self.assertCommandOutputContains('test ' + script_path, [
            '"p.nonexistent" still did not exist in',
            '"#encoded" did not have a text change in',
            '"p[style]" never appeared in',
            '/github\.com/ did not load in',
            '/foobar/ did not pop up in',
            '"Lorem ipsum" did not appear in the page in',
            'return false',
            'did not evaluate to something truthy in'
        ], failing=True)

    @timeout(20)
    def test_casper_test_instance_overriding(self):
        script_path = os.path.join(TEST_ROOT, 'tester', 'casper-instance-override.js')
        self.assertCommandOutputContains('test ' + script_path, [
            "Fatal: you can't override the preconfigured casper instance",
        ], failing=True)

    @timeout(20)
    def test_dubious_test(self):
        script_path = os.path.join(TEST_ROOT, 'tester', 'dubious.js')
        self.assertCommandOutputContains('test ' + script_path, [
            script_path,
            'dubious test: 2 tests planned, 1 tests executed',
            'FAIL 1 test executed',
            '1 passed',
            '1 failed',
            '1 dubious',
            '0 skipped',
        ], failing=True)

    @timeout(20)
    def test_exit_test(self):
        script_path = os.path.join(TEST_ROOT, 'tester', 'exit.js')
        self.assertCommandOutputContains('test ' + script_path, [
            script_path,
            '# sample',
            'PASS Subject is strictly true',
            'PASS 1 test executed',
            '1 passed',
            '0 failed',
            '0 dubious',
            '0 skipped.',
            'exited'
        ])

    @timeout(20)
    def test_skipped_test(self):
        script_path = os.path.join(TEST_ROOT, 'tester', 'skipped.js')
        self.assertCommandOutputContains('test ' + script_path, [
            script_path,
            'SKIP 1 test skipped',
            'PASS 1 test executed',
            '1 passed',
            '0 failed',
            '0 dubious',
            '1 skipped',
        ])

    @timeout(60)
    def test_full_suite(self):
        folder_path = os.path.join(TEST_ROOT, 'tester')
        failing_script = os.path.join(folder_path, 'failing.js')
        passing_script = os.path.join(folder_path, 'passing.js')
        mytest_script = os.path.join(folder_path, 'mytest.js')
        self.assertCommandOutputContains(' '.join([
            'test', failing_script, passing_script, mytest_script
        ]), [
            'Test file: %s' % failing_script,
            '# true',
            'FAIL Subject is strictly true',
            '#    type: assert',
            '#    file: %s:3' % failing_script,
            '#    code: test.assert(false);',
            '#    subject: false',
            'Test file: %s' % mytest_script,
            'PASS ok1',
            'PASS ok2',
            'PASS ok3',
            'Test file: %s' % passing_script,
            '# true',
            'PASS Subject is strictly true',
            'FAIL 5 tests executed',
            '4 passed',
            '1 failed',
            '0 dubious',
            '0 skipped',
            'Details for the 1 failed test:',
            'assert: Subject is strictly true',
        ], failing=True)

    @timeout(60)
    def test_fail_fast(self):
        folder_path = os.path.join(TEST_ROOT, 'fail-fast', 'standard')
        self.assertCommandOutputContains('test %s --fail-fast' % folder_path, [
            '# test 1',
            '# test 2',
            '--fail-fast: aborted all remaining tests',
            'FAIL 2 tests executed',
            '1 passed',
            '1 failed',
            '0 dubious',
            '0 skipped',
        ], failing=True)

    @timeout(60)
    def test_manual_abort(self):
        folder_path = os.path.join(TEST_ROOT, 'fail-fast', 'manual-abort')
        self.assertCommandOutputContains('test %s --fail-fast' % folder_path, [
            '# test abort()',
            'PASS test 1',
            'PASS test 5',
            'this is my abort message',
        ], failing=True)


if __name__ == '__main__':
    unittest.main()
