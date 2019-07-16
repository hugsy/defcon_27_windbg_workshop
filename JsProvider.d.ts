/*--------------------------------------------------------------------------
 * Copyright 2017 Microsoft Corporation
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this
 * software and associated documentation files (the "Software"), to deal in the Software 
 * without restriction, including without limitation the rights to use, copy, modify, merge, 
 * publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons 
 * to whom the Software is furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all copies 
 * or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, 
 * INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR
 * PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE
 * FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
 * OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 * 
 * 
 * Note that the TypeScript definitions here do not account for anything which
 * is added by debugger extensions.  These are only core concepts of the JavaScript
 * provider or aspects of the data model which are fixed by specification.
 *-------------------------------------------------------------------------*/

/*
 * To use, add "/// <reference path="JSProvider.d.ts" /> " at the top of the
 * script
 */
interface frameInterface
{
    /**
     * The list of (non parameter) local variables in scope at this location in the call stack.  Each such local is available
     * as a property of this object.
     */
    LocalVariables: any;

    /**
     * The list of parameters to the call at this location in the call stack.  Each such parameter is available
     * as a property of this object.
     */
    Parameters: any;
}

interface stackInterface
{
    /**
     * An iterable of individual frames within the call stack
     */
    Frames: frameInterface[];
}

interface threadInterface
{
    /**
     * The thread identifier (TID) for the thread
     */
    Id: number;
    Stack: stackInterface;
}

interface moduleInterface
{
    /**
     * The base address of the module within the address space of a process
     */
    BaseAddress: host.Int64;

    /**
     * The name of the module
     */
    Name: string;

    /**
     * The size of the module in bytes
     */
    Size: host.Int64;
}

interface processInterface
{
    /**
     * An iterable representing all the threads in the process
     */
    Threads: threadInterface[];

    /**
     * The name of the process
     */
    Name: string;

    /**
     * The process identifier (PID) for the process
     */
    Id: number;

    /**
     * An iterable representing all the modules loaded into the address space of the process
     */
    Modules: moduleInterface[];
}

interface sessionInterface
{
    Processes: processInterface[];
}

interface debuggerInterface
{
    Sessions: sessionInterface[];
}

interface namespaceInterface
{
    Debugger: debuggerInterface;
}

interface baseClassInterface
{
    /**
     * The name of the base class.
     */
    name: string;

    /**
     * The offset of the base class within its parent class.
     */
    offset: host.Int64;

    /**
     * A type object representing the type of the base class.
     */
    type: typeObjectInterface;
}

interface fieldInterface
{
    /**
     * The name of the field.
     */
    name: string;

    /**
     * A type object representing the type of the field.
     */
    type: typeObjectInterface;

    /**
     * Indicates where the field is stored (as member data which has an offset, as static data which has a location, or
     * as a constant which has a value).
     */
    locationKind: string;

    /**
     * For fields which are member data, this returns the field's offset into the type which contains it.
     */
    offset: host.Int64;

    /**
     * For fields which are static data, this returns a location of the static data.
     */
    location: any;

    /**
     * For fields which are constant values, this returns the constant value.
     */
    value: any;
}

interface typeObjectInterface
{
    /**
     * The name of the type
     */
    name: string;

    /**
     * The size of the type in bytes
     */
    size: host.Int64;

    /**
     * The kind of type (e.g.: a pointer, a user defined type, an array, etc...)
     */
    typeKind: string;

    /**
     * The type from which this type is based.  This does not represent C++ inheritence.  For a pointer type, this is the
     * type of the thing pointed to.  For an array type, this is the type contained in the array.
     */
    baseType: typeObjectInterface;

    /**
     * An object which represents the data fields within the type.  Each field is a property within the returned object.
     */
    fields: any;

    /**
     * An array of objects which represents all of the base classes of the given type.  Note that if there are no base
     * classes, an empty array will be returned.
     */
    baseClasses: baseClassInterface[];

    /**
     * For types which are functions, this returns a type object representing the return type of the function.
     */
    functionReturnType: typeObjectInterface;

    /**
     * For types which are functions, this returns an array of type objects representing the parameter types of the function.
     */
    functionParameterTypes: typeObjectInterface[];

    /**
     * For types which are functions, this returns the calling convention of the function.
     */
    functionCallingConvention: string;

    /**
     * For types which are pointers, this returns the kind of pointer (e.g.: a standard '*', a reference '&', etc...)
     */
    pointerKind: string;

    /**
     * For types which are pointer-to-member, this returns a type object representing the member type.
     */
    memberType: typeObjectInterface;

    /**
     * This indicates whether the type is a generic (e.g.: template) type.
     */
    isGeneric: bool;

    /**
     * For types which are generic, this returns the generic arguments.  Such can be type objects or other values.
     */
    genericArguments: any[];

    /**
     * This returns whether the type is a bitfield.
     */
    isBitField: bool;

    /**
     * This returns the positional layout of a bitfield type.
     */
    bitFieldPositions: bitFieldInterface;

}

declare namespace host {

    /**
     * Creates a new pointer object of the given type at the given address.
     *
     * @param address The address (or location) that the pointer is at
     * @param moduleName The name of the module which contains the type of the pointer
     * @param typeName The type name of the pointer
     * @param contextInheritor An optional argument which supplies the context in which the address is valid
     * @return A pointer object of the specified type
    */
    function createPointerObject(address: any, moduleName: string, typeName: string, contextInheritor?: any): any;

    /**
     * Creates a new pointer object of the given type at the given address.
     *
     * @param address The address (or location) that the pointer is at
     * @param moduleName The name of the module which contains the type of the pointer
     * @param typeObject An instance of a type object representing the type of the pointer
     * @param contextInheritor An optional argument which supplies the context in which the address is valid
     * @return A pointer object of the specified type
    */
    function createPointerObject(address: any, typeObject: any, contextInheritor?: any): any;

    /**
     * Creates a new object of the given type at the given location (or address)
     * 
     * @param location The location (or address) that the object is stored at in target memory
     * @param moduleName The name of the module which contains the type of the object
     * @param typeName The type of the object
     * @param contextInheritor An optional argument which supplies the context in which the location is valid
     * @return An object of the specified type
     */
    function createTypedObject(location: any, moduleName: string, typeName: string, contextInheritor?: any): any;

    /**
     * Creates a new object of the given type at the given location (or address)
     * 
     * @param location The location (or address) that the object is stored at in target memory
     * @param typeObject An instance of a type object representing the type of the object to create
     * @param contextInheritor An optional argument which supplies the context in which the location is valid
     * @return An object of the specified type
     */
    function createTypedObject(location: any, typeObject: any, contextInheritor?: any): any;

    /**
     * Contains the object representing the current session of the debugger (Which target, dump, etc...) is being debugged
     */
    var currentSession: sessionInterface;

    /**
     * Contains the object representing the current process of the debugger 
     */
    var currentProcess: processInterface;

    /**
     * Contains the object representing the current thread of the debugger
     */
    var currentThread : threadInterface;

    /**
     * Calls into the debug host to evaluate an expression using the language of the debug target only.  If the optional
     * contextInheritor argument is supplied, the expression will be evaluated in the context (e.g.: address space
     * and debug target) of the argument; otherwise, it will be evaluated in the current context of the debugger.
     * 
     * @param expression The expression to be evaluated.  Such expression may utilize only constructs of the language being debugged
     * @param contextInheritor An optional argument which supplies the context in which the expression is evaluated
     * @return The result of the expression evaluation
     */
    function evaluateExpression(expression: string, contextInheritor?: any): any;

    /**
     * Calls into the debug host to evaluate an expression using the language of the debug target only.  The context argument
     * indicates the implicit *this* pointer the utilize for the evaluation.  The expression will be evaluated in the context
     * (e.g.: address space and debug target) as well as the scope of the context argument.
     * 
     * @param context The context (and scope) in which the expression will be evaluated.  This will be the implicit *this* pointer
     * @param expression The expression to be evaluated.  Such expression may utilize only constructs of the language being debugged
     * @return The result of the expression evaluation
     */
    function evaluateExpressionInContext(context: any, expression: string): any;

    /**
     * Returns an object for a global symbol within a particular module.  This method does not and cannot work with modules which
     * have stripped symbols.
     * 
     * @param moduleName The name of the module in which the symbol is located
     * @param symbolName The name of the symbol to return an object for
     * @param contextInheritor An optional argument which supplies the context in which the module and symbol names are valid
     * @return An object representing the global symbol
     */
    function getModuleSymbol(moduleName: string, symbolName: string, contextInheritor?: any): any;

    /**
     * Returns an object for a global symbol within a particular module.
     * 
     * @param moduleName The name of the module in which the symbol is located
     * @param symbolName The name of the symbol to return an object for
     * @param typeName An optional argument which supplies the name of the type of the global symbol.  If this argument is not specified, the type name is picked up from the symbols.  This argument is mandatory for working on public stripped symbols
     * @param contextInheritor An optional argument which supplies the context in which the module and symbol names are valid
     * @return An object representing the global symbol
     */
    function getModuleSymbol(moduleName: string, symbolName: string, typeName?: string, contextInheritor?: any): any;

    /**
     * Returns a type object for a given type within a particular module.
     *
     * @param moduleName The name of the module in which the type is located
     * @param typeName The name of the type to find within the given module
     * @param contextInheritor An optional argument which supplies the context in which the module and type names are valid
     * @return An object representing the type
     */
    function getModuleType(moduleName: string, typeName: string, contextInheritor?: any): typeObjectInterface;

    /**
     * Returns the data model which was registered against a given name.  Note that it is perfectly legal to call this against
     * a name which is not yet registered.  Doing so will create a stub for that name and manipulations of the stub will be made to the actual
     * object upon registration
     * 
     * @param modelName The name of the data model to return
     * @return The data model registered against the given name
     */
    function getNamedModel(modelName: string): any;

    /**
     * An object which represents a value with a specified set of indicies.  An iterator which returns values which can be indexed by value through the data model
     * must return instances of this object instead.
     */
    class indexedValue
    {
        /**
         * Constructs an object represnting a value with a specified set of indicies.
         * 
         * @param value The value
         * @param indicies The index to the value in a container.  This must be an array and can contain more than one element for multi-dimensional containers
         */
        constructor(value: any, indicies: any[]);
    }

    /**
     * A class which represents a 64-bit signed or unsigned number.
     */
    class Int64 {

        /**
         * Constructs a new 64-bit signed or unsigned number.  If the highValue argument is supplied, the 64-bit value is a combination
         * of a lower 32-bits supplied by the value argument and a higher 32-bits supplied by the highValue argument.
         * 
         * @param value The value to place in the 64-bit quantity
         * @param highValue If present, the value to place in the upper 64-bits of the returned 64-bit quantity.  If this argument is present, value must be an unsigned 32-bit quantity
         * @return A 64-bit number
         */
        constructor(value: number, highValue?: number);
    }

    /**
     * An object representing a modification of the object model of the debugger.  This links together a JavaScript class (or prototype) with a data model.  The JavaScript
     * class (or prototype) becomes a parent data model (e.g.: similar to a prototype) to the data model registered under the supplied name. 
     * 
     * An instance of this object can be returned in the array of records returned from the initializeScript method.
     */
    class namedModelParent
    {
        /**
         * Constructs a new registration record representing a link between a JavaScript class (or prototype) and a data model registered under the supplied name.
         * 
         * @param object A JavaScript class or prototype which will become a parent of the data model with the specified name
         * @param modelName The name of a data model for which to add the JavaScript class or prototype as a parent
         */
        constructor(object: any, modelName: string);
    }

    /**
     * An object representing a modification of the object model of the debugger.  This registers a JavaScript class (or prototype) as a data model under a specified name.
     * This allows other extensions to find this data model and extend or alter it from another script or another language.
     * 
     * An instance of this object can be returned in the array of records returned from the initializeScript method.
     */
    class namedModelRegistration
    {
        /**
         * Constructs a new registration record representing the registration of a JavaScript class (or prototype) as a data model under a given name.
         * 
         * @param object A JavaScript class or prototype which will become a data model registered under the supplied name
         * @param modelName The name under which the JavaScript class or prototype will be registered
         */
        constructor(object: any, modelName: string);
    }

    /**
     * Provides access to the namespace of the debug target.
     */
    var namespace: namespaceInterface;

    /**
     * This registers a JavaScript class (or prototype) as a data model under the given name.  Such a registration allows the class (or prototype) to
     * be located and extended by other scripts or debugger extensions.  Note that a script should prefer to return a namedModelRegistration object
     * from its initializeScript method rather than calling this method imperatively.  Any script which makes changes imperatively with this method
     * is required to have an uninitializeScript method to clean up.
     * 
     * @param object The JavaScript class or prototype which will become a data model registered under the supplied name
     * @param modelName The name under which the JavaScript class or prototype will be registered
     */
    function registerNamedModel(object: any, modelName: string);

    /**
     * This registers a JavaScript class (or prototype) as an extension data model for a native type as indicated by the supplied type signature.  Note
     * that a script should prefer to return a typeSignatureExtension object from its initializeScript method rather than doing this imperatively.  Any
     * script which makes changes imperatively with this method is required to have an uninitializeScript method to clean up.
     * 
     * @param object The JavaScript class or prototype which will become an extension data model for the given type
     * @param typeSignature The type signature describing the types for which the extension data model applies.  The type signature syntax is language specific.  For C/C++, this follows NatVis syntax
     * @param moduleName An optional argument supplying a constraint for the type signature.  If supplied, only types which are in the module indicated by this name are extended
     * @param minVersion An optional argument supplying a constraint for the type signature.  If supplied (in x.y.z.a format), only module versions of at least this value are extended
     * @param maxVersion An optional argument supplying a constraint for the type signature.  If supplied (in x.y.z.a format), only module versions up to this value are extended
     */
    function registerExtensionForTypeSignature(object: any, typeSignature: string, moduleName?: string, minVersion?: string, maxVersion?: string);

    /**
     * This registers a JavaScript class (or prototype) as an extension data model for a native type as indicated by the supplied type signature.  Note
     * that a script should prefer to return a typeSignatureRegistration object from its initializeScript method rather than doing this imperatively.  Any
     * script which makes changes imperatively with this method is required to have an uninitializeScript method to clean up.
     * 
     * @param object The JavaScript class or prototype which will become the canonical data model (visualizer) for the given type
     * @param typeSignature The type signature describing the types for which the data model applies.  The type signature syntax is language specific.  For C/C++, this follows NatVis syntax
     * @param moduleName An optional argument supplying a constraint for the type signature.  If supplied, only types which are in the module indicated by this name are visualized
     * @param minVersion An optional argument supplying a constraint for the type signature.  If supplied (in x.y.z.a format), only module versions of at least this value are visualized
     * @param maxVersion An optional argument supplying a constraint for the type signature.  If supplied (in x.y.z.a format), only module versions up to this value are visualized
     */
    function registerPrototypeForTypeSignature(object: any, typeSignature: string, moduleName?: string, minVersion?: string, maxVersion?: string);

    /**
     * This method acts similarly to the standard JavaScript parseInt method except that it returns a library Int64 type instead.  If a radix is supplied,
     * the parse will occur in either base 2, 8, 10, or 16 as indicated.
     * 
     * @param string The string to parse
     * @param radix The radix to utilize the parse the given number
     * @return An Int64 object representing the parsed 64-bit quantity.
     */
    function parseInt64(string: string, radix?: number): Int64;

    /**
     * An object representing a modification of the object model of the debugger.  This links together a JavaScript class (or prototype) with a native type
     * as indicated by a type signature.  The JavaScript class (or prototype) becomes an extension data model (e.g.: similar to a prototype) to the 
     * native type as indicated by the supplied type signature. 
     * 
     * An instance of this object can be returned in the array of records returned from the initializeScript method.
     */
    class typeSignatureExtension
    {
        /**
         * Constructs a new registration record representing a link between a JavaScript class (or prototype) and an extension for a native type as indicated by a type signature.
         * 
         * @param object A JavaScript class or prototype which will become an extension data model for the native type as indicated by the type signature
         * @param typeSignature The type signature describing the types for which the data model applies.  The type signature syntax is language specific.  For C/C++, this follows NatVis syntax
         * @param moduleName An optional argument supplying a constraint for the type signature.  If supplied, only types which are in the module indicated by this name are extended
         * @param minVersion An optional argument supplying a constraint for the type signature.  If supplied (in x.y.z.a format), only module versions of at least this value are extended
         * @param maxVersion An optional argument supplying a constraint for the type signature.  If supplied (in x.y.z.a format), only module versions up to this value are extended
         */
        constructor(object: any, typeSignature: string, moduleName?: string, minVersion?: string, maxVersion?: string);
    }

    /**
     * An object representing a modification of the object model of the debugger.  This links together a JavaScript class (or prototype) with a native type
     * as indicated by a type signature.  The JavaScript class (or prototype) becomes the canonical data model (visualizer) for the native type as indicated
     * by the supplied type signature. 
     * 
     * An instance of this object can be returned in the array of records returned from the initializeScript method.
     */
    class typeSignatureRegistration
    {
        /**
         * Constructs a new registration record representing a link between a JavaScript class (or prototype) and a canonical data model (visualizer) for a native type as indicated by a type signature.
         * 
         * @param object A JavaScript class or prototype which will become the canonical data model (visualizer) for the native type as indicated by the type signature
         * @param typeSignature The type signature describing the types for which the data model applies.  The type signature syntax is language specific.  For C/C++, this follows NatVis syntax
         * @param moduleName An optional argument supplying a constraint for the type signature.  If supplied, only types which are in the module indicated by this name are visualized
         * @param minVersion An optional argument supplying a constraint for the type signature.  If supplied (in x.y.z.a format), only module versions of at least this value are visualized
         * @param maxVersion An optional argument supplying a constraint for the type signature.  If supplied (in x.y.z.a format), only module versions up to this value are visualized
         */
        constructor(object: any, typeSignature: string, moduleName?: string, minVersion?: string, maxVersion?: string);
    }

    /**
     * This unregisters a data model from lookup by the given name undoing any operation performed by a call to the registerNamedModel method.
     * 
     * @param modelName The data model registered by this name is unregistered
     */
    function unregisterNamedModel(modelName: string);

    /**
     * This unregisters a JavaScript class (or prototype) from being an extension data model for a native type as given by the supplied type
     * signature.  It is the logical undo of a call to the registerExtensionForTypeSignature method.
     *
     * @param object A JavaScript class or prototype which will be unregistered as the canonical data model (visualizer) for the native type as indicated by the type signature
     * @param typeSignature The type signature describing the types for which the data model applies.  The type signature syntax is language specific.  For C/C++, this follows NatVis syntax
     * @param moduleName An optional argument supplying a constraint for the type signature.  If supplied, only types which are in the module indicated by this name are unregistered
     * @param minVersion An optional argument supplying a constraint for the type signature.  If supplied (in x.y.z.a format), only module versions of at least this value are unregistered
     * @param maxVersion An optional argument supplying a constraint for the type signature.  If supplied (in x.y.z.a format), only module versions up to this value are unregistered
     */
    function unregisterExtensionForTypeSignature(object: any, typeSignature: string, moduleName?: string, minVersion?: string, maxVersion?: string);

    /**
     * This unregisters a JavaScript class (or prototype) from being an extension data model for a native type as given by the supplied type
     * signature.  It is the logical undo of a call to the registerPrototypeForTypeSignature method.
     *
     * @param object A JavaScript class or prototype which will be unregistered as an extension data model for the native type as indicated by the type signature
     * @param typeSignature The type signature describing the types for which the data model applies.  The type signature syntax is language specific.  For C/C++, this follows NatVis syntax
     * @param moduleName An optional argument supplying a constraint for the type signature.  If supplied, only types which are in the module indicated by this name are unregistered
     * @param minVersion An optional argument supplying a constraint for the type signature.  If supplied (in x.y.z.a format), only module versions of at least this value are unregistered
     * @param maxVersion An optional argument supplying a constraint for the type signature.  If supplied (in x.y.z.a format), only module versions up to this value are unregistered
     */
    function unregisterPrototypeForTypeSignature(object: any, typeSignature: string, moduleName?: string, minVersion?: string, maxVersion?: string);

    /**
     * A sub-namespace of the host which deals with diagnostic functionality
     */
    namespace diagnostics
    {
        /**
         * This provides printf style debugging to a script.  At present, output from debugLog is routed to the output console of the debugger.  At a later
         * point in time, it will be routed to a separate channel for the UI.  This method should never be used as a means of explicit console output.
         * 
         * @param args A list of arguments to convert to string and route to the diagnostic channel.
         */
        function debugLog(...args: any[]);

        /**
         * When set, indicates that all JavaScript exceptions that escape the script context should be logged to the debug log.  This can be set 
         * at any point during script execution.
         */
        var logUnhandledExceptions: bool;
    }

    namespace memory
    {
        /**
         * This reads a raw array of values from the address space of the debug target and places a typed array on top of the view of its memory.
         * 
         * @param location The location (or address) that the object is stored at in target memory
         * @param numElements The number of distinct elements to read from target memory.  This will be the size of the returned array
         * @param elementSize The size of each element to read from target memory.  If this argument is not specified, the call will read single byte elements
         * @param isSigned Indicates whether the elements being read from target memory are signed or not.  If this argument is not specified, the call will read unsigned values
         * @param contextInheritor An optional argument which supplies the context in which to read target memory
         * @return A typed array of 8, 16, 32, or 64 bit signed or unsigned values as indicated by the arguments passed to the method
         */
        function readMemoryValues(location: any, numElements: number, elementSize?: number, isSigned?: number, contextInheritor?: any): any;

        /**
         * This reads a narrow (current code page) string from the address space of the debug target, converts it to UTF-16 and returns the result as a
         * JavaScript string.  
         * 
         * @param location The location of the string to read.  This argument can also be an address (a 64-bit value), or a native char*
         * @param contextInheritor An optional argument which supplies the context in which to read target memory
         * @return A string read from target memory 
         */
        function readString(location: any, contextInheritor?: any): string;
        
        /**
         * This reads a narrow (current code page) string from the address space of the debug target, converts it to UTF-16 and returns the result as a
         * JavaScript string.  
         * 
         * @param location The location of the string to read.  This argument can also be an address (a 64-bit value), or a native char*
         * @param length An optional length argument which supplies the length of the string to read.  If not specified, the method will read until a null terminator
         * @param contextInheritor An optional argument which supplies the context in which to read target memory
         * @return A string read from target memory 
         */
        function readString(location: any, length?: number, contextInheritor?: any): string;

        /**
         * This reads a wide (UTF-16) string from the address space of the debug target and returns the result as a
         * JavaScript string.  
         * 
         * @param location The location of the string to read.  This argument can also be an address (a 64-bit value), or a native char*
         * @param contextInheritor An optional argument which supplies the context in which to read target memory
         * @return A string read from target memory 
         */
        function readWideString(location: any, contextInheritor?: any): string;

        /**
         * This reads a wide (UTF-16) string from the address space of the debug target and returns the result as a
         * JavaScript string.  
         * 
         * @param location The location of the string to read.  This argument can also be an address (a 64-bit value), or a native char*
         * @param length An optional length argument which supplies the length of the string to read.  If not specified, the method will read until a null terminator
         * @param contextInheritor An optional argument which supplies the context in which to read target memory
         * @return A string read from target memory 
         */
        function readWideString(location: any, length?: number, contextInheritor?: any): string;
    }

    namespace typeSystem
    {
        /**
         * An object which represents a single dimension within a (potentially) multi-dimensional array.  Dimensions are described by three
         * key values: the lowerBound, the length, and the stride.  
         */
        class arrayDimension
        {
            /**
             * Constructs an object represnting a value with a specified set of indicies.
             * 
             * @param lowerBound Defines the lower bound of the array dimension.  Most commonly, this is zero indicating that the indexes in this dimension are zero based.
             * @param length Defines the length of the array dimension.  The range of valid indicies of this dimension are defined by the half open set [lowerBound, lowerBound + length)
             * @param stride Defines the stride of the array dimension.  This indicates the number of bytes of memory in between one index of this dimension and the next index of this dimension.  For the typical single dimensional array, this is most often the size of the base type of the array.  For multi-dimensional arrays, this can be used to indicate whether the array is row major or column major.  It can also be used to indicate that there is padding between array elements, rows, columns, etc...
             */
            constructor(lowerBound: host.Int64, length: host.Int64, stride: host.Int64);

            /**
             * Defines the lower bound of the array dimension.  Most commonly, this is zero indicating that the indexes in this dimension
             * are zero based.
             */
            lowerBound: host.Int64;

            /**
             * Defines the length of the array dimension.  The range of valid Indicies of this dimension are defined by the
             * half open set [lowerBound, lowerBound + length)
             */
            length: host.Int64;

            /**
             * Defines the stride of the array dimension.  This indicates the number of bytes of memory in between one index of this
             * dimension and the next index of this dimension.  For the typical single dimensional array, this is most often the size
             * of the base type of the array.  For multi-dimensional arrays, this can be used to indicate whether the array is row major
             * or column major.  It can also be used to indicate that there is padding between array elements, rows, columns, etc...
             */
            stride: host.Int64;
        }

        namespace pointerKind
        {
            /**
             * Represents a standard pointer (*)
             */
            standard: number;

            /**
             * Represents a pointer which is in reality a reference (&)
             */
            reference: number;

            /**
             * Represents a pointer which is in reality an r-value reference (&&)
             */
            rValueReference: number;

            /**
             * Represents a pointer which is in reality a C++/CX hat (^)
             */
            cxHat : number;
        }
    }
}

