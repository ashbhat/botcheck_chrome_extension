//
//  ViewController.swift
//  BotCheck
//
//  Created by ajl on 10/17/18.
//  Copyright © 2018 SwishLabs. All rights reserved.
//

import Cocoa
import SafariServices

class ViewController: NSViewController {
    let extensionIdentifier = "com.swishlabs.BotCheck.mac.BotCheck-for-Twitter"
    
    @IBOutlet weak var button: NSButton!
    @IBOutlet weak var label: NSTextField!
    @IBOutlet weak var statusImage: NSImageView!
    
    override func viewDidLoad() {
        super.viewDidLoad()
        updateStatePeriodically()
    }
    
     func updateStatePeriodically() {
        SFSafariExtensionManager.getStateOfSafariExtension(withIdentifier: extensionIdentifier) { (state, error) in
            DispatchQueue.main.async {
                if (state?.isEnabled ?? false) {
                    self.label.stringValue = "Botcheck for Safari is enabled"
                    self.statusImage.image = NSImage(named: "happy")
                }
                else {
                    self.label.stringValue = "Botcheck for Safari is currently disabled"
                    self.statusImage.image = NSImage(named: "gray")
                }
            }
            
            // Check again in a few seconds
            DispatchQueue.main.asyncAfter(deadline: .now() + 2.5, execute: {
                self.updateStatePeriodically()
            })
        }
    }
    
    @IBAction func openPreferencesClicked(_ sender: Any) {
        // TODO show if extension is enabled or not
        // https://developer.apple.com/documentation/safariservices/sfsafariextensionmanager
        SFSafariApplication.showPreferencesForExtension(withIdentifier: extensionIdentifier)
    }
    
    override var representedObject: Any? {
        didSet {
        // Update the view, if already loaded.
        }
    }


}

