//
//  SafariExtensionHandler.swift
//  BotCheck for Twitter
//
//  Created by ajl on 10/17/18.
//  Copyright © 2018 SwishLabs. All rights reserved.
//

import SafariServices

enum ActionType: String {
    case openNewTab = "BC_OPEN_NEW_TAB"
}

class SafariExtensionHandler: SFSafariExtensionHandler {
    
//    override func messageReceived(withName messageName: String, from page: SFSafariPage, userInfo: [String : Any]?) {
//        // This method will be called when a content script provided by your extension calls safari.extension.dispatchMessage("message").
//        page.getPropertiesWithCompletionHandler { properties in
//            NSLog("The extension received a message (\(messageName)) from a script injected into (\(String(describing: properties?.url))) with userInfo (\(userInfo ?? [:]))")
//        }
//    }
    
    override func messageReceived(withName messageName: String, from page: SFSafariPage, userInfo: [String : Any]?) {
        NSLog("Received message \(messageName)")
        
        switch messageName {
        case ActionType.openNewTab.rawValue:
            let url = URL(string: userInfo?["url"] as! String)
            openNewTab(url: url!)
            break
        default:
            NSLog("Received message with unsupported type: \(messageName)")
        }
    }
    
    func openNewTab(url: URL) {
        NSLog("Will attempt to open \(url)")
        
        SFSafariApplication.getActiveWindow { (activeWindow) in
            // Request a new tab on the active window, with the URL we want.
            // Note: only urls that this extension has permission to will actually open, otherwise silently fail.
            activeWindow?.openTab(with: url, makeActiveIfPossible: true, completionHandler: {_ in
                // Perform some action here after the page loads if you'd like.
            })
        }
    }
    
    override func toolbarItemClicked(in window: SFSafariWindow) {
        // This method will be called when your toolbar item is clicked.
        NSLog("The extension's toolbar item was clicked")
    }
    
    override func validateToolbarItem(in window: SFSafariWindow, validationHandler: @escaping ((Bool, String) -> Void)) {
        // This is called when Safari's state changed in some way that would require the extension's toolbar item to be validated again.
        validationHandler(true, "")
    }
    
    override func popoverViewController() -> SFSafariExtensionViewController {
        return SafariExtensionViewController.shared
    }

}
