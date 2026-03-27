import { createEditor } from 'lexical';
import { $getRoot, $createParagraphNode, $createTextNode, $getSelection, $isRangeSelection, $createRangeSelection, $setSelection} from 'lexical';
import { registerRichText } from '@lexical/rich-text';

class LexicalEditor {
    constructor(elementId) {
        this.element = document.getElementById(elementId);
        this.editor = null;
        this.undoStack = [];
        this.redoStack = [];
        this.isUpdating = false;
        this.initialize();
    }
    
    initialize() {
        this.editor = createEditor({
            namespace: 'MyEditor',
            theme: {
                paragraph: 'editor-paragraph',
                text: {
                    bold: 'editor-text-bold',
                    italic: 'editor-text-italic',
                    underline: 'editor-text-underline'
                }
            },
            onError: (error) => {
                console.error('Lexical error:', error);
            }
        });
        
        this.editor.setRootElement(this.element);
        
        this.setInitialContent();
        
        registerRichText(this.editor);
        
        this.setupUndoRedo();
        
        this.setupToolbar();
        
        this.setupKeyboardShortcuts();
    
        this.setupSelectionListener();
        
        console.log('Lexical editor initialized successfully!');
    }
    
    setInitialContent() {
        this.editor.update(() => {
            const root = $getRoot();
            
            root.clear();
            
            const paragraph1 = $createParagraphNode();
            const text1 = $createTextNode('Welcome to Lexical Editor!');
            paragraph1.append(text1);
            
            const paragraph2 = $createParagraphNode();
            const text2 = $createTextNode('This is a real Lexical editor built without React.');
            paragraph2.append(text2);
            
            const paragraph3 = $createParagraphNode();
            const text3 = $createTextNode('Try formatting text using the toolbar or keyboard shortcuts (Ctrl+B, Ctrl+I, Ctrl+U).');
            paragraph3.append(text3);
            
            const paragraph4 = $createParagraphNode();
            const text4 = $createTextNode('Undo and Redo work with Ctrl+Z and Ctrl+Y!');
            paragraph4.append(text4);
            
            root.append(paragraph1);
        });
        
        this.saveToHistory();
    }
    
    setupUndoRedo() {
        this.editor.registerUpdateListener(() => {
            if (!this.isUpdating) {
                this.saveToHistory();
            }
        });
    }
    
    saveToHistory() {
        const editorState = this.editor.getEditorState();
        const serializedState = JSON.stringify(editorState.toJSON());
        this.undoStack.push(serializedState);
        this.redoStack = [];

        if (this.undoStack.length > 50) {
            this.undoStack.shift();
        }
        
        this.updateHistoryStatus();
    }
    
    undo() {
        if (this.undoStack.length > 1) {
            const currentState = this.editor.getEditorState();
            this.redoStack.push(JSON.stringify(currentState.toJSON()));
            
            this.undoStack.pop();
            const previousState = this.undoStack[this.undoStack.length - 1];
            
            this.isUpdating = true;
            const parsedState = JSON.parse(previousState);
            const newState = this.editor.parseEditorState(parsedState);
            this.editor.setEditorState(newState);
            this.isUpdating = false;
            
            this.updateHistoryStatus();
        }
    }
    
    redo() {
        if (this.redoStack.length > 0) {
            const currentState = this.editor.getEditorState();
            this.undoStack.push(JSON.stringify(currentState.toJSON()));
            
            const nextState = this.redoStack.pop();
            
            this.isUpdating = true;
            const parsedState = JSON.parse(nextState);
            const newState = this.editor.parseEditorState(parsedState);
            this.editor.setEditorState(newState);
            this.isUpdating = false;
            
            this.updateHistoryStatus();
        }
    }
    
    formatText(formatType) {
        this.editor.update(() => {
            const selection = $getSelection();
            
            if ($isRangeSelection(selection)) {
                selection.formatText(formatType);
            }
        });
    }
    
    setupToolbar() {
        const boldBtn = document.getElementById('bold-btn');
        const italicBtn = document.getElementById('italic-btn');
        const underlineBtn = document.getElementById('underline-btn');
        const undoBtn = document.getElementById('undo-btn');
        const redoBtn = document.getElementById('redo-btn');
        
        if (boldBtn) {
            boldBtn.addEventListener('click', () => this.formatText('bold'));
        }
        
        if (italicBtn) {
            italicBtn.addEventListener('click', () => this.formatText('italic'));
        }
        
        if (underlineBtn) {
            underlineBtn.addEventListener('click', () => this.formatText('underline'));
        }
        
        if (undoBtn) {
            undoBtn.addEventListener('click', () => this.undo());
        }
        
        if (redoBtn) {
            redoBtn.addEventListener('click', () => this.redo());
        }
    }
    
    setupKeyboardShortcuts() {
        this.element.addEventListener('keydown', (e) => {
            const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
            const modifier = isMac ? e.metaKey : e.ctrlKey;
            
            if (modifier) {
                switch(e.key) {
                    case 'b':
                        e.preventDefault();
                        this.formatText('bold');
                        break;
                    case 'i':
                        e.preventDefault();
                        this.formatText('italic');
                        break;
                    case 'u':
                        e.preventDefault();
                        this.formatText('underline');
                        break;
                    case 'z':
                        e.preventDefault();
                        this.undo();
                        break;
                    case 'y':
                        e.preventDefault();
                        this.redo();
                        break;
                    case 'Z':
                        if (e.shiftKey) {
                            e.preventDefault();
                            this.redo();
                        }
                        break;
                }
            }
        });
    }
    
    setupSelectionListener() {
        this.editor.registerUpdateListener(() => {
            this.editor.getEditorState().read(() => {
                const selection = $getSelection();
                const boldBtn = document.getElementById('bold-btn');
                const italicBtn = document.getElementById('italic-btn');
                const underlineBtn = document.getElementById('underline-btn');
                
                if ($isRangeSelection(selection)) {
                    if (boldBtn) {
                        boldBtn.classList.toggle('active', selection.hasFormat('bold'));
                    }
                    if (italicBtn) {
                        italicBtn.classList.toggle('active', selection.hasFormat('italic'));
                    }
                    if (underlineBtn) {
                        underlineBtn.classList.toggle('active', selection.hasFormat('underline'));
                    }
                } else {
                    if (boldBtn) boldBtn.classList.remove('active');
                    if (italicBtn) italicBtn.classList.remove('active');
                    if (underlineBtn) underlineBtn.classList.remove('active');
                }
            });
        });
    }
    
    updateHistoryStatus() {
        const statusDiv = document.getElementById('history-status');
        if (statusDiv) {
            statusDiv.textContent = `History: ${this.undoStack.length} states • ${this.redoStack.length} redo states`;
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const editor = new LexicalEditor('editor');
});