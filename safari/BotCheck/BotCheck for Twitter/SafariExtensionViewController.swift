//
//  SafariExtensionViewController.swift
//  BotCheck for Twitter
//
//  Created by ajl on 10/17/18.
//  Copyright © 2018 SwishLabs. All rights reserved.
//

import SafariServices

class SafariExtensionViewController: SFSafariExtensionViewController {
    
    static let shared: SafariExtensionViewController = {
        let shared = SafariExtensionViewController()
        shared.preferredContentSize = NSSize(width:320, height:240)
        return shared
    }()

}
